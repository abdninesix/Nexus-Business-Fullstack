import express from 'express';
import { getDeals, createDeal, addPayment, getDealsForEntrepreneur, updateDealStatus, updateDealByInvestor } from '../controllers/dealController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Investor routes
router.get('/', protect, getDeals);
router.post('/', protect, createDeal);
router.post('/payment', protect, addPayment);
router.patch('/:id', protect, updateDealByInvestor);

// Entrepreneur routes
router.get('/received', protect, getDealsForEntrepreneur);
router.patch('/:id/status', protect, updateDealStatus);

export default router;