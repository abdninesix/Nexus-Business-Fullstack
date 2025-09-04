import express from 'express';
import { getDeals, createDeal, addPayment, getDealsForEntrepreneur, updateDealStatus, updateDealByInvestor, getTransactionsForEntrepreneur, getTransactionsForDeal, getTransactionsForInvestor } from '../controllers/dealController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Investor routes
router.get('/', protect, getDeals);
router.post('/', protect, createDeal);
router.post('/payment', protect, addPayment);
router.get('/transactions/sent', protect, getTransactionsForInvestor);

// Entrepreneur routes
router.get('/received', protect, getDealsForEntrepreneur);
router.get('/transactions/received', protect, getTransactionsForEntrepreneur);
router.get('/:dealId/transactions', protect, getTransactionsForDeal);
router.patch('/:id/status', protect, updateDealStatus);

// Generic deal routes
router.patch('/:id', protect, updateDealByInvestor);


export default router;