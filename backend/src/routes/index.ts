import express from 'express';
import authRoutes from './auth';
import notificationRoutes from './notificationRoutes';
import testRoutes from './test.routes';
import userRoutes from './user.routes';
import productRoutes from './productRoutes';

// Create a router instance
const router = express.Router();

// Register route handlers
router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

// Test routes - only available in non-production environments
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRoutes);
}

// Example route setup:
// import userRoutes from './userRoutes';
// router.use('/users', userRoutes);

export default router; 