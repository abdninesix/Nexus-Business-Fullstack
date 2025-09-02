// routes/messageRoutes.js
import express from 'express';
import { getConversations, getMessages, getUnreadCount, markMessagesAsRead, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// This route gets the list of conversations for the sidebar
router.get('/', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:otherUserId', protect, getMessages);
router.post('/', protect, sendMessage);
router.patch('/read', protect, markMessagesAsRead);


export default router;