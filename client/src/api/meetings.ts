// src/api/meetings.ts
import api from './axios';
import { User } from '../types';

export interface Meeting {
  _id: string;
  title: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  participants: User[];
  organizer: User;
  location?: string;
}

export interface NewMeetingData {
  title: string;
  start: Date;
  end: Date;
  participantIds: string[];
  location?: string;
}

export const fetchMeetings = async (): Promise<Meeting[]> => {
  const { data } = await api.get('/meetings');
  return data;
};

export const createMeeting = async (meetingData: NewMeetingData): Promise<Meeting> => {
  const { data } = await api.post('/meetings', meetingData);
  return data;
};

export const deleteMeeting = async (meetingId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(`/meetings/${meetingId}`);
    return data;
};