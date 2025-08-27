import express from 'express';
import { getMeetings, createMeeting, deleteMeeting, getMeetingById } from '../controllers/meetingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMeetings);
router.post('/', protect, createMeeting);
router.delete('/:id', protect, deleteMeeting);
router.get('/:id', protect, getMeetingById);

export default router;