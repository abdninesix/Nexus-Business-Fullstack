// routes/messageRoutes.js
import express from 'express';
import { getConversations, getMessages, getUnreadCount, markMessagesAsRead, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Conversations list
router.get('/', protect, getConversations);

// Unread messages count
router.get('/unread-count', protect, getUnreadCount);

// Mark as read
router.patch('/read', protect, markMessagesAsRead);

// Send a message
router.post('/', protect, sendMessage);

// Messages with a specific user (keep dynamic last)
router.get('/:otherUserId', protect, getMessages);

export default router;