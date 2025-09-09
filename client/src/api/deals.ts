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

export interface UpdateDealData {
    status?: Deal['status'];
    amount?: string;
    equity?: string;
    stage?: string;
}

// Data needed to add a payment
export interface NewPaymentData {
    dealId: string;
    amount: number;
    notes?: string;
}

export interface Transaction {
    _id: string;
    dealId: PopulatedDealInfo;
    investorId: string;
    amount: number;
    date: string;
    notes?: string;
}

interface PopulatedDealInfo {
    _id: string;
    startupName: string;
    // These fields will be populated User objects
    investorId: User;
    entrepreneurId: User;
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

// 4. Fetch deals received by the entrepreneur
export const fetchReceivedDeals = async (): Promise<Deal[]> => {
    const { data } = await api.get('/deals/received');
    return data;
};

// 5. Update a deal's status
export const updateDealStatus = async (payload: { id: string, status: 'accepted' | 'rejected' }): Promise<Deal> => {
    const { id, status } = payload;
    const { data } = await api.patch(`/deals/${id}/status`, { status });
    return data;
};

// 6. Universal update function for an investor
export const updateDeal = async (payload: { id: string; data: UpdateDealData }): Promise<Deal> => {
    const { id, data } = payload;
    const response = await api.patch(`/deals/${id}`, data);
    return response.data;
};

// 7. Fetch all transactions received by an entrepreneur
export const fetchReceivedTransactions = async (): Promise<Transaction[]> => {
    const { data } = await api.get('/deals/transactions/received');
    return data;
};

// 8. Fetch transactions for a single deal
export const fetchTransactionsForDeal = async (dealId: string): Promise<Transaction[]> => {
    const { data } = await api.get(`/deals/${dealId}/transactions`);
    return data;
};

// 9. Fetch all transactions sent by an investor
export const fetchSentTransactions = async (): Promise<Transaction[]> => {
    const { data } = await api.get('/deals/transactions/sent');
    return data;
};