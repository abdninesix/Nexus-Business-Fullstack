import express from 'express';
import { getNotifications, markAllAsRead, deleteAllNotifications, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all notifications
router.get('/', protect, getNotifications);

// Update (mark all as read)
router.patch('/read-all', protect, markAllAsRead);

// Delete notifications
router.delete('/delete-all', protect, deleteAllNotifications);
router.delete('/:id', protect, deleteNotification);

export default router;