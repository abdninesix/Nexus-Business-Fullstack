// routes/authRoutes.js
import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  toggleTwoFactor,
  verifyLoginToken,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth Routes
router.post('/register', register);
router.post('/login', login);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Get profile
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

//Two Factor Auth Routes
router.post('/2fa/toggle', protect, toggleTwoFactor); // A simple route to turn 2FA on or off
router.post('/2fa/login-verify', verifyLoginToken); // This is the same as the TOTP method

router.post('/logout', protect, logout);

export default router;
