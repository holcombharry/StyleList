import express from 'express';
import { searchProducts } from '../controllers/productController';

const router = express.Router();

/**
 * Product search routes
 */

/**
 * @route   POST /api/products/search
 * @desc    Search for fashion products matching criteria
 * @access  Public
 */
router.post('/search', searchProducts);

export default router; 