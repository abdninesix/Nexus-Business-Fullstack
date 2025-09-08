// src/api/auth.ts
import api from './axios';
import { User, AuthSuccessData, UserRole } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface TwoFactorResponse {
  twoFactorRequired: true;
  userId: string;
}

// API function to register a user
export const registerUser = async (userData: RegisterData): Promise<AuthSuccessData> => {
  const { data } = await api.post('/auth/register', userData);
  // Assuming the register endpoint logs the user in and returns the same payload as login
  return data;
};

// API function to log in a user
export const loginUser = async (credentials: LoginData): Promise<AuthSuccessData | TwoFactorResponse> => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

// API function to request a password reset link
export const forgotPasswordRequest = async (email: string): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

// API function to submit the new password
export const resetPasswordRequest = async (payload: { token: string; password: string }): Promise<{ message: string }> => {
  const { token, password } = payload;
  // This matches your backend route: /reset-password/:token
  const { data } = await api.post(`/auth/reset-password/${token}`, { password });
  return data;
};

// API function to call the logout endpoint
export const logoutUser = async (): Promise<{ message: string }> => {
  const { data } = await api.post('/auth/logout');
  return data;
};

// API function to toggle 2FA
export const toggle2FA = async (): Promise<{ isEnabled: boolean, message: string }> => {
  const { data } = await api.post('/auth/2fa/toggle');
  return data;
};

// Verifies the 6-digit code from the email
export const verifyLogin2FAToken = async (
  payload: { userId: string; token: string }
): Promise<AuthSuccessData> => {
  const { data } = await api.post('/auth/2fa/login-verify', payload);
  return data;
};