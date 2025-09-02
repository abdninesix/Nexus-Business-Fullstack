// routes/collaborationRoutes.js
import express from 'express';
import { createRequest, deleteRequest, getReceivedRequests, getRequestStatus, getSentRequests, updateRequestStatus } from '../controllers/collaborationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/received', protect, getReceivedRequests);
router.patch('/:id', protect, updateRequestStatus);
router.get('/status/:entrepreneurId', protect, getRequestStatus);
router.delete('/:id', protect, deleteRequest);
router.get('/sent', protect, getSentRequests);

export default router;