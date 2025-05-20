import express, { RequestHandler } from 'express';
import { 
  signup, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword,
  verifyResetCode,
  resetPasswordWithCode,
  getCurrentUser,
  googleOAuth,
  appleOAuth,
  checkEmailProvider
} from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/signup', signup as RequestHandler);
router.post('/login', login as RequestHandler);
router.post('/forgot-password', forgotPassword as RequestHandler);
router.post('/reset-password/:token', resetPassword as RequestHandler); // Legacy endpoint
router.post('/verify-reset-code', verifyResetCode as RequestHandler);
router.post('/reset-password-with-code', resetPasswordWithCode as RequestHandler);
router.post('/oauth/google', googleOAuth as RequestHandler);
router.post('/oauth/apple', appleOAuth as RequestHandler);
router.post('/check-provider', checkEmailProvider as RequestHandler);

// Protected routes
router.use(authenticate as RequestHandler);
router.post('/logout', logout as RequestHandler);
router.get('/me', getCurrentUser as RequestHandler);

export default router; 