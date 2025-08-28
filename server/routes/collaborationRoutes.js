// routes/collaborationRoutes.js
import express from 'express';
import { createRequest, getReceivedRequests, updateRequestStatus } from '../controllers/collaborationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/received', protect, getReceivedRequests);
router.patch('/:id', protect, updateRequestStatus);

export default router;