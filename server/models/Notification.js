import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    // The user who will receive the notification
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // The user who triggered the notification (optional)
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // The type of notification
    type: {
        type: String,
        enum: [
            // Message Notifications
            'newMessage',

            // Meeting Notifications
            'newMeeting',
            'meetingCancelled',

            // Collaboration Notifications
            'newConnectionRequest',
            'connectionRequestAccepted',
            'connectionRequestRejected',

            // Deal Notifications
            'newDeal',
            'dealStatusUpdate',
            'newTransaction'
        ],
        required: true,
    },

    // The content of the notification
    message: { type: String, required: true },

    // Whether the user has seen it
    isRead: { type: Boolean, default: false },

    // Optional link to navigate to on click
    link: { type: String },

}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);