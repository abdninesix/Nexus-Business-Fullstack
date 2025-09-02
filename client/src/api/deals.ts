// src/api/deals.ts
import api from './axios';
import { User } from '../types';

// --- TYPE DEFINITIONS ---

export interface Deal {
    _id: string;
    investorId: User;
    entrepreneurId: User; // Populated by the backend
    startupName: string;
    amount: string;
    equity: string;
    status: 'Proposed' | 'Due Diligence' | 'Term Sheet' | 'Negotiation' | 'Closed' | 'Passed' | 'Rejected';
    stage: string;
    createdAt: string;
    updatedAt: string; // Used for lastActivity
}

// Data needed to create a new deal
export interface NewDealData {
    entrepreneurId: string;
    startupName: string;
    amount: string;
    equity: string;
    status: Deal['status'];
    stage: string;
}

// Data needed to add a payment
export interface NewPaymentData {
    dealId: string;
    amount: number;
    notes?: string;
}

// --- API FUNCTIONS ---

// 1. Fetch all deals for the logged-in investor
export const fetchDeals = async (): Promise<Deal[]> => {
    const { data } = await api.get('/deals');
    return data;
};

// 2. Create a new deal
export const createDeal = async (dealData: NewDealData): Promise<Deal> => {
    const { data } = await api.post('/deals', dealData);
    return data;
};

// 3. Add a payment to a specific deal
export const addPayment = async (paymentData: NewPaymentData): Promise<any> => {
    const { data } = await api.post('/deals/payment', paymentData);
    return data;
};

// Fetch deals received by the entrepreneur
export const fetchReceivedDeals = async (): Promise<Deal[]> => {
    const { data } = await api.get('/deals/received');
    return data;
};

// Update a deal's status
export const updateDealStatus = async (payload: { id: string, status: 'accepted' | 'rejected' }): Promise<Deal> => {
    const { id, status } = payload;
    const { data } = await api.patch(`/deals/${id}/status`, { status });
    return data;
};