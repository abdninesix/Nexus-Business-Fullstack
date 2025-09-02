// routes/dealRoutes.js
import express from 'express';
import { getDeals, createDeal, addPayment } from '../controllers/dealController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDeals);
router.post('/', protect, createDeal);
router.post('/payment', protect, addPayment);

export default router;