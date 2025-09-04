// src/api/notifications.ts
import api from './axios';
import { User } from '../types';

export interface Notification {
  _id: string;
  recipient: string;
  sender: User; // Populated by backend
  type: 'newMessage' | 'newMeeting' | 'requestAccepted' | 'newDeal';
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const deleteNotification = async (notificationId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/notifications/${notificationId}`);
  return data;
};