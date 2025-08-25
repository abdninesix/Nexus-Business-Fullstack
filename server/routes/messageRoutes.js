// routes/messageRoutes.js
import express from 'express';
import { getConversations, getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// This route gets the list of conversations for the sidebar
router.get('/', protect, getConversations);
router.get('/:otherUserId', protect, getMessages);
router.post('/', protect, sendMessage);

export default router;