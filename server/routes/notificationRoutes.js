import express from 'express';
import { getNotifications, markAllAsRead, deleteAllNotifications, deleteNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/delete-all', protect, deleteAllNotifications);

export default router;