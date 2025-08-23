// routes/authRoutes.js
import express from 'express';
import { getEntrepreneurs } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get profile
router.get('/entrepreneurs', protect, getEntrepreneurs);

export default router;
