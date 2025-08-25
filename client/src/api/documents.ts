// src/api/documents.ts
import api from './axios';

// Define a type for the document object returned by the API
// This should match your Mongoose schema
export interface Document {
  _id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  fileId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

// 1. Fetch all documents for the logged-in user
export const fetchDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get('/documents');
  return data;
};

// 2. Upload a new document
export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// 3. Delete a document by its ID
export const deleteDocument = async (documentId: string): Promise<{ message: string }> => {
  const { data } = await api.delete(`/documents/${documentId}`);
  return data;
};