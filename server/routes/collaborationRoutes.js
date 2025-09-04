// routes/collaborationRoutes.js
import express from 'express';
import { createRequest, deleteRequest, getReceivedRequests, getRequestStatus, getSentRequests, updateRequestStatus } from '../controllers/collaborationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create request
router.post('/', protect, createRequest);

// Get requests
router.get('/received', protect, getReceivedRequests);
router.get('/sent', protect, getSentRequests);
router.get('/status/:entrepreneurId', protect, getRequestStatus);

// Update/Delete requests (keep dynamic last)
router.patch('/:id', protect, updateRequestStatus);
router.delete('/:id', protect, deleteRequest);

export default router;