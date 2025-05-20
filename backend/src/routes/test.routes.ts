import express from 'express';
import { testEmail } from '../controllers/testController';

const router = express.Router();

/**
 * @route   POST /api/test/email
 * @desc    Test email functionality
 * @access  Private (should be restricted in production)
 */
router.post('/email', testEmail as unknown as express.RequestHandler);

export default router; 