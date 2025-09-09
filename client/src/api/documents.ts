// src/api/documents.ts
import { User } from '../types';
import api from './axios';

export interface Document {
  _id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  fileId: string;
  uploadedBy: User | string; // The ID of the owner

  // These are new fields for permissions and signing
  sharedWith: string[]; // An array of user IDs
  signer?: User | string; // The designated signer, can be populated

  status: 'Private' | 'Shared' | 'Awaiting Signature' | 'Signed' | 'Archived';

  signedUrl?: string;
  signedAt?: string; // ISO date string

  createdAt: string;
  updatedAt: string;
}

// This function is for getting user's own documents
export const fetchMyDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get('/documents'); // Calls GET /
  return data;
};

// This function is for viewing documents on another user's profile
export const fetchSharedDocuments = async (userId: string): Promise<Document[]> => {
  const { data } = await api.get(`/documents/user/${userId}`); // Calls GET /user/:userId
  return data;
};

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/documents/${documentId}`);
  return data;
};

// --- API FUNCTIONS for sharing and signing ---

// Shares a document with another user
export const shareDocument = async (payload: { id: string; shareWithUserId: string }): Promise<Document> => {
  const { id, shareWithUserId } = payload;
  const { data } = await api.patch(`/documents/${id}/share`, { shareWithUserId });
  return data;
};

// Sends a signature request to another user
export const requestSignature = async (payload: { id: string; signerId: string }): Promise<Document> => {
  const { id, signerId } = payload;
  const { data } = await api.patch(`/documents/${id}/request-signature`, { signerId });
  return data;
};

// The action of signing a document that is awaiting your signature
export const signDocument = async (id: string): Promise<Document> => {
  // This route doesn't need a body, the backend knows who the signer is (req.user)
  const { data } = await api.patch(`/documents/${id}/sign`);
  return data;
};