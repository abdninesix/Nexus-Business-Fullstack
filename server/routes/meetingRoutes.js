import express from 'express';
import { getMeetings, createMeeting, deleteMeeting, getMeetingById, respondToMeeting } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.patch('/:id/respond', protect, respondToMeeting);

// Dynamic routes last
router.get('/:id', protect, getMeetingById);
router.delete('/:id', protect, deleteMeeting);

export default router;