import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { updateProfile, getProfile } from '../controllers/userController';

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authenticate);

// Get current user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', updateProfile);

export default router; 