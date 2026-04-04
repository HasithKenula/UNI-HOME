import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', uploadSingle('profileImage'), register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);

export default router;
