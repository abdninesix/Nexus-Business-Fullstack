import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
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
      start: new Date(start),
      end: new Date(end),
      participants: allParticipantIds,
      organizer: organizerId,
      location,
    });

    // --- EMIT NOTIFICATION TO ALL PARTICIPANTS ---
    const organizer = await User.findById(organizerId).select('name');

    // We need to notify everyone EXCEPT the person who created the meeting (the organizer)
    const participantsToNotify = allParticipantIds.filter(id => id !== organizerId.toString());

    participantsToNotify.forEach(participantId => {
      const participantSocketId = getUserSocketId(participantId);
      if (participantSocketId) {
        console.log(`Sending meeting notification to participant: ${participantId}`);
        io.to(participantSocketId).emit("getNotification", {
          senderName: organizer.name,
          type: "newMeeting", // <-- A new notification type
          message: `${organizer.name} has scheduled a new meeting with you: "${title}"`,
          createdAt: new Date(),
        });
      } else {
        console.log(`Participant ${participantId} is offline. No meeting notification sent.`);
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