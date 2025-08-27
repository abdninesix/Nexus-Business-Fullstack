// routes/messageRoutes.js
import express from 'express';
import { getConversations, getMessages, getUnreadCount, markMessagesAsRead, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// This route gets the list of conversations for the sidebar
router.get('/', protect, getConversations);
router.get('/:otherUserId', protect, getMessages);
router.post('/', protect, sendMessage);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read', protect, markMessagesAsRead);

export default router;