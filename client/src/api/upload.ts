// src/api/upload.ts
import { User } from '../types';
import api from './axios';

interface UploadResponse {
  // Assuming your backend returns the URL of the uploaded file
  url: string;
  fileId: string;
}

// API function to upload a file
export const uploadFileRequest = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};