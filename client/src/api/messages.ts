// src/api/messages.ts
import api from './axios';
import { User } from '../types'; // Assuming User type is appropriate

// This will be the structure of a conversation object from the API
export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage: {
    content: string;
    sender: string; // Will be populated with sender ID
    createdAt: string;
  };
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string;
  receiver: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Fetch all conversations for the current user
export const fetchConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get('/messages');
  return data;
};

// Fetch all messages with a specific user
export const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
  const { data } = await api.get(`/messages/${otherUserId}`);
  return data;
};

// Send a message to a specific user
export const sendMessageRequest = async (payload: { receiverId: string; content: string }): Promise<Message> => {
  const { data } = await api.post('/messages', payload);
  return data;
};

export const fetchUnreadCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/messages/unread-count');
  return data;
};

export const markAsRead = async (senderId: string): Promise<{ message: string }> => {
  const { data } = await api.patch('/messages/read', { senderId });
  return data;
};