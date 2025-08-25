// routes/authRoutes.js
import express from 'express';
import { getEntrepreneurs, getInvestors, getUserById } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get profile
router.get('/entrepreneurs', protect, getEntrepreneurs);
router.get('/investors', protect, getInvestors);

router.get('/:id', protect, getUserById);

export default router;
