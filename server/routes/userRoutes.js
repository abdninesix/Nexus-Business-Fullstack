// routes/authRoutes.js
import express from 'express';
import { getAllUsers, getEntrepreneurs, getInvestors, getUserById } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All users
router.get('/', protect, getAllUsers);

// Specific user groups
router.get('/entrepreneurs', protect, getEntrepreneurs);
router.get('/investors', protect, getInvestors);

// Single user (dynamic route last)
router.get('/:id', protect, getUserById);

export default router;
