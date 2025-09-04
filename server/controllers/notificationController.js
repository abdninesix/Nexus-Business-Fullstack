import Notification from '../models/Notification.js';

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate('sender', 'name avatarUrl') // Populate sender info
            .sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
};

// Mark all notifications as read for the logged-in user
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: 'All notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
};

// Delete all notifications for the logged-in user
export const deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });
        res.status(200).json({ message: 'All notifications deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete notifications.' });
    }
};

// Delete one notification for logged-in user
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Security Check: Ensure the person deleting is the recipient of the notification
    if (notification.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this notification.' });
    }

    await notification.deleteOne();

    res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};