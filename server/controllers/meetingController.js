import Meeting from '../models/Meeting.js';

// Create a new meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, participants, startTime, endTime } = req.body;

    // Optional: check for conflicts
    const conflict = await Meeting.findOne({
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
      ],
      participants: { $in: participants.concat(req.user._id) },
    });

    if (conflict) {
      return res.status(400).json({ message: 'Meeting conflict detected.' });
    }

    const meeting = await Meeting.create({
      title,
      description,
      organizer: req.user._id,
      participants,
      startTime,
      endTime,
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all meetings for current user
export const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ organizer: req.user._id }, { participants: req.user._id }],
    }).sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting status (accept/reject)
export const updateMeetingStatus = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });

    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    meeting.status = status;
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a meeting
export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found.' });

    // Only organizer can delete
    if (meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await meeting.remove();
    res.json({ message: 'Meeting deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
