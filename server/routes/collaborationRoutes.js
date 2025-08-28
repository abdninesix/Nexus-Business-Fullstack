// routes/collaborationRoutes.js
import express from 'express';
import { createRequest, getReceivedRequests, getRequestStatus, updateRequestStatus } from '../controllers/collaborationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createRequest);
router.get('/received', protect, getReceivedRequests);
router.patch('/:id', protect, updateRequestStatus);
router.get('/status/:entrepreneurId', protect, getRequestStatus);

export default router;