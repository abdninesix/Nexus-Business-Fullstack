// controllers/messageController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { getUserSocketId, io } from '../server.js';

// Get all conversations for the logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'name avatarUrl role isOnline', // Select only the fields you need
      })
      .sort({ updatedAt: -1 }); // Show the most recent conversations first

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// Get all messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    // Find the conversation between the two users
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(200).json([]); // No conversation yet, return empty array
    }

    // Find all messages for that conversation
    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 'asc' });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const senderId = req.user._id;

    if (!content || !receiverId) {
      return res.status(400).json({ message: "Content and receiver ID are required." });
    }

    // --- The "Find or Create" Logic ---

    // 1. First, try to find an existing conversation.
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // 2. If no conversation exists, create a new one.
    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        // lastMessage will be added next
      });
      // Note: We don't save it yet. We'll save it after the message is created.
    }

    // --- Message Creation Logic (remains the same) ---

    // 3. Create the new message document.
    const newMessage = new Message({
      conversationId: conversation._id, // This works even on an unsaved document
      sender: senderId,
      receiver: receiverId,
      content,
    });

    // 4. Save the new message to get its timestamps.
    const savedMessage = await newMessage.save();

    // 5. Update the conversation's lastMessage field.
    conversation.lastMessage = {
      content: savedMessage.content,
      sender: savedMessage.sender,
      createdAt: savedMessage.createdAt,
    };

    // 6. Save the conversation (either the found one or the newly created one).
    await conversation.save();

    // --- EMIT NOTIFICATION ---
    const receiverSocketId = getUserSocketId(receiverId);
    if (receiverSocketId) {
      const sender = await User.findById(senderId).select('name');
      io.to(receiverSocketId).emit("getNotification", {
        senderName: sender.name,
        type: "newMessage",
        message: `You have a new message from ${sender.name}`,
        createdAt: new Date(),
      });
    }

    // 7. Respond with the successfully saved message.
    res.status(201).json(savedMessage);

  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// A function to get the count of unread messages
export const getUnreadCount = async (req, res) => {
  try {
    // --- THIS IS THE FIX ---
    // 1. Add a guard clause to ensure req.user exists.
    if (!req.user || !req.user._id) {
      console.error("CRITICAL ERROR in getUnreadCount: req.user is not defined. The 'protect' middleware might have failed or is missing.");
      // Send a 401 Unauthorized error, which is more accurate than a 500.
      return res.status(401).json({ message: "Not authenticated." });
    }
    // -------------------------

    const userId = req.user._id;
    const count = await Message.countDocuments({ receiver: userId, isRead: false });
    res.status(200).json({ count });

  } catch (error) {
    console.error("Error in getUnreadCount controller:", error);
    // 2. Fix the error message to be specific.
    res.status(500).json({ message: 'Failed to fetch unread message count' });
  }
};

// We also need a way to mark messages as read. Let's add that now.
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { senderId } = req.body; // The user whose chat is being opened

    await Message.updateMany(
      { receiver: userId, sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};