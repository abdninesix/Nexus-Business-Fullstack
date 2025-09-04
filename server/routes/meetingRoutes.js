import express from 'express';
import { getMeetings, createMeeting, deleteMeeting, getMeetingById } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);

// Dynamic routes last
router.get('/:id', protect, getMeetingById);
router.delete('/:id', protect, deleteMeeting);

export default router;