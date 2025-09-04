import express from 'express';
import { getNotifications, markAllAsRead, deleteAllNotifications, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllAsRead);
router.delete('/delete-all', protect, deleteAllNotifications);
router.delete('/:id', protect, deleteNotification);

export default router;