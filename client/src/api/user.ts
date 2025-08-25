// src/api/user.ts
import api from './axios';
import { User } from '../types';

interface UpdateProfileData {
    name?: string;
    email?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
}

interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

// API function to update the user's profile data
export const updateUserProfile = async (updates: UpdateProfileData): Promise<User> => {
    const { data } = await api.put('/auth/profile', updates);
    return data;
};

// API function to change the user's password
export const changeUserPassword = async (passwords: ChangePasswordData): Promise<{ message: string }> => {
    const { data } = await api.put('/auth/change-password', passwords);
    return data;
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/users');
  return data;
};

export const fetchEntrepreneurs = async (): Promise<User[]> => {
  const { data } = await api.get('/users/entrepreneurs');
  return data;
};

export const fetchInvestors = async (): Promise<User[]> => {
  const { data } = await api.get('/users/investors');
  return data;
};

export const fetchUserById = async (userId: string): Promise<User> => {
  const { data } = await api.get(`/users/${userId}`);
  return data;
};