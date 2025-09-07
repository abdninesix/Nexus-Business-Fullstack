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

    // --- Initialize participantResponses ---
    const participantResponses = allParticipantIds.map(id => ({
      userId: id,
      status: id.toString() === organizerId.toString() ? 'accepted' : 'pending'
    }));

    const allAccepted = participantResponses.every(p => p.status === 'accepted');

    const newMeeting = await Meeting.create({
      title,
      start: startTime,
      end: endTime,
      participants: allParticipantIds,
      organizer: organizerId,
      participantResponses,
      status: allAccepted ? 'confirmed' : 'pending',
      location,
    });

    // --- EMIT NOTIFICATION TO ALL PARTICIPANTS ---
    const organizer = await User.findById(organizerId);
    const participantsToNotify = participantResponses.filter(p => p.status === 'pending').map(p => p.userId);

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

// Respond to a meeting invitation (Accept/Decline)
export const respondToMeeting = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    const userId = req.user._id;

    // Fetch the full user document for the person who is responding.
    const respondingUser = await User.findById(userId);
    if (!respondingUser) {
      return res.status(404).json({ message: "Responding user not found." });
    }

    if (!meeting) return res.status(404).json({ message: "Meeting not found." });

    // Find the user in the participant responses
    const userResponse = meeting.participantResponses.find(p => p.userId.toString() === userId.toString());
    if (!userResponse) return res.status(403).json({ message: "You are not a participant of this meeting." });
    if (userResponse.status !== 'pending') return res.status(400).json({ message: "You have already responded." });

    userResponse.status = status;

    // If this user rejects, the whole meeting is effectively cancelled
    if (status === 'rejected') {
      meeting.status = 'cancelled';
    }

    // If this user accepts, check if ALL participants have now accepted
    const allAccepted = meeting.participantResponses.every(p => p.status === 'accepted');
    if (allAccepted) {
      meeting.status = 'confirmed';
    }

    const updatedMeeting = await meeting.save();

    const otherParticipantIds = meeting.participants
      .filter(pId => pId.toString() !== userId.toString())
      .map(pId => pId.toString())

    const actionText = status === 'accepted' ? 'accepted' : 'declined';
    const notificationMessage = `${respondingUser.name} has ${actionText} the meeting: "${meeting.title}".`;

    // --- THIS IS THE FIX ---
    otherParticipantIds.forEach(async (participantId) => { // `participantId` is now a STRING
      await Notification.create({
        recipient: participantId,
        sender: userId,
        type: 'meetingResponse',
        message: notificationMessage,
        link: `/calendar`
      });

      // Now this call is guaranteed to work because `participantId` is a string
      const socketId = getUserSocketId(participantId);
      if (socketId) {
        io.to(socketId).emit("getNotification", {
          senderName: respondingUser.name,
          type: 'meetingResponse',
          message: notificationMessage,
          createdAt: new Date(),
        });
      }
    });

    // If the meeting is now confirmed, send a second, global notification
    if (updatedMeeting.status === 'confirmed') {
      const confirmedMessage = `The meeting "${meeting.title}" is now confirmed!`;
      otherParticipantIds.forEach(async (participantId) => {
        await Notification.create({
          recipient: participantId,
          sender: userId,
          type: 'meetingConfirmed',
          message: confirmedMessage,
          link: `/calendar`
        });

        const socketId = getUserSocketId(participantId.toString());
        if (socketId) io.to(socketId).emit("getNotification", {
          senderName: respondingUser.name,
          type: 'meetingConfirmed',
          message: confirmedMessage,
          createdAt: new Date(),
        });
      });
    }

    res.status(200).json(updatedMeeting);
  } catch (error) { res.status(500).json({ message: 'Failed to respond to meeting.' }); }
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

    // --- NEW VALIDATION ---
    const now = new Date();
    // Check if the meeting end time has passed
    if (new Date(meeting.end) < now) {
      return res.status(403).json({ message: 'This meeting has already ended.' });
    }
    // Check if the meeting is not confirmed
    if (meeting.status !== 'confirmed') {
      return res.status(403).json({ message: 'This meeting is not confirmed and cannot be joined.' });
    }
    // ----------------------

    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meeting' });
  }
};