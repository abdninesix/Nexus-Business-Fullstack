import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { io, getUserSocketId } from '../server.js';

// Get all meetings for the current user
export const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ participants: req.user._id })
      .populate('participants', 'name role avatarUrl')
      .populate('organizer', 'name');
    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
};

// Create a new meeting with clash detection
export const createMeeting = async (req, res) => {
  try {
    const { title, start, end, participantIds, location } = req.body;
    const organizerId = req.user._id;

    // --- NEW VALIDATION LOGIC ---
    const startTime = new Date(start);
    const endTime = new Date(end);
    const toleranceInMinutes = 2;
    const now = new Date();
    const tolerantNow = new Date(now.getTime() - (toleranceInMinutes * 60 * 1000));

    // 1. Check if the start time is in the past
    if (startTime < tolerantNow) {
      return res.status(400).json({ message: "Cannot schedule a meeting in the past." });
    }

    // 2. Check if the end time is before the start time
    if (endTime <= startTime) {
      return res.status(400).json({ message: "Meeting end time must be after the start time." });
    }
    // --- END OF VALIDATION ---

    const allParticipantIds = [...new Set([...participantIds, organizerId])]; // Ensure organizer is included

    // --- CLASH DETECTION LOGIC ---
    // Find any existing meeting that involves ANY of the participants AND overlaps with the new meeting time.
    const existingMeeting = await Meeting.findOne({
      participants: { $in: allParticipantIds }, // Check for any participant
      status: 'confirmed', // Only check against confirmed meetings
      $or: [
        { start: { $lt: end, $gte: start } }, // An existing meeting starts during the new one
        { end: { $gt: start, $lte: end } }, // An existing meeting ends during the new one
        { start: { $lte: start }, end: { $gte: end } }, // An existing meeting engulfs the new one
      ],
    });

    if (existingMeeting) {
      return res.status(409).json({ message: 'A meeting with one of the participants is already scheduled at this time.' });
    }
    // --- END OF CLASH DETECTION ---

    const newMeeting = await Meeting.create({
      title,
      start: startTime,
      end: endTime,
      participants: allParticipantIds,
      organizer: organizerId,
      location,
    });

    // --- EMIT NOTIFICATION TO ALL PARTICIPANTS ---
    const organizer = await User.findById(req.user._id);
    const participantsToNotify = newMeeting.participants.filter(pId => pId.toString() !== req.user._id.toString());

    participantsToNotify.forEach(async (participantId) => {
      const notificationMessage = `${organizer.name} has scheduled a meeting with you: "${newMeeting.title}"`;

      await Notification.create({
        recipient: participantId,
        sender: req.user._id,
        type: 'newMeeting',
        message: notificationMessage,
        link: `/calendar`
      });

      const socketId = getUserSocketId(participantId.toString());
      if (socketId) {
        io.to(socketId).emit("getNotification", {
          senderName: organizer.name,
          type: 'newMeeting',
          message: notificationMessage,
          createdAt: new Date(),
          relatedData: { meetingId: newMeeting._id }
        });
      }
    });
    // --- END OF NOTIFICATION ---

    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create meeting' });
  }
};

// Delete a meeting
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    // Optional: Check if the user is the organizer before deleting
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can delete this meeting.' });
    }

    // --- NOTIFY OTHER PARTICIPANTS of Cancellation ---
    const canceller = req.user;
    const participantsToNotify = meeting.participants.filter(p => p._id.toString() !== canceller._id.toString());

    participantsToNotify.forEach(async (participant) => {
      const notificationMessage = `Your meeting "${meeting.title}" with ${canceller.name} has been cancelled.`;

      await Notification.create({
        recipient: participant._id,
        sender: canceller._id,
        type: 'meetingCancelled', // <-- A NEW TYPE
        message: notificationMessage,
        link: `/calendar`
      });

      const socketId = getUserSocketId(participant._id.toString());
      if (socketId) {
        io.to(socketId).emit("getNotification", {
          senderName: canceller.name,
          type: 'meetingCancelled',
          message: notificationMessage,
          createdAt: new Date(),
        });
      }
    });

    await meeting.deleteOne();
    res.status(200).json({ message: 'Meeting deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete meeting' });
  }
};

export const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('participants', 'name avatarUrl');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meeting' });
  }
};