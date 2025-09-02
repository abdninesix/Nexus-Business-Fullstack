// routes/authRoutes.js
import express from 'express';
import { getAllUsers, getEntrepreneurs, getInvestors, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllUsers);

router.get('/entrepreneurs', protect, getEntrepreneurs);
router.get('/investors', protect, getInvestors);

router.get('/:id', protect, getUserById);

export default router;
