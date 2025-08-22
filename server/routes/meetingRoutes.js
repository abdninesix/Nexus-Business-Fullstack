import express from 'express';
import {
  createMeeting,
  getMeetings,
  updateMeetingStatus,
  deleteMeeting,
} from '../controllers/meetingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// CRUD for meetings
router.post('/', protect, createMeeting);
router.get('/', protect, getMeetings);
router.patch('/:id/status', protect, updateMeetingStatus);
router.delete('/:id', protect, deleteMeeting);

export default router;
