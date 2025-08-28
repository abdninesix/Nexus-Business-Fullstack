// src/api/collaborations.ts
import { User } from '../types';
import api from './axios';

export interface CollaborationRequest {
  _id: string;
  investorId: User; 
  entrepreneurId: string; // This might just be an ID if not populated
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export const fetchReceivedRequests = async (): Promise<CollaborationRequest[]> => {
  const { data } = await api.get('/collaborations/received');
  return data;
};

export const updateRequestStatus = async (payload: { id: string; status: 'accepted' | 'rejected' }): Promise<CollaborationRequest> => {
  const { id, status } = payload;
  const { data } = await api.patch(`/collaborations/${id}`, { status });
  return data;
};

export const createCollaborationRequest = async (payload: { entrepreneurId: string; message: string }): Promise<CollaborationRequest> => {
    const { data } = await api.post('/collaborations', payload);
    return data;
};