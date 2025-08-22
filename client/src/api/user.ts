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

// NEW function to call the delete endpoint
export const removeProfilePicture = async (): Promise<User> => {
    const { data } = await api.delete('/upload'); // Calls the new DELETE /api/upload route
    return data;
};