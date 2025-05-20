import express from 'express';
import { registerDeviceToken, unregisterDeviceToken, sendNotification } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate as express.RequestHandler);

// Device token registration routes
router.post('/register-device', registerDeviceToken as unknown as express.RequestHandler);
router.delete('/unregister-device', unregisterDeviceToken as unknown as express.RequestHandler);

// Send notification route
router.post('/send', sendNotification as unknown as express.RequestHandler);

export default router; 