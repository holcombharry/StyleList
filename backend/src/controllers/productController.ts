import { Request, Response } from 'express';
import { scrapeFashionProducts } from '../utils/scraper';
import { ScraperInput } from '../utils/scraper/types';

/**
 * Controller for fashion product search functionality
 */

/**
 * Search for fashion products matching the given criteria
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract search parameters from request body
    const { query, includedBrands, excludedBrands, priceMin, priceMax, retailer } = req.body;

    // Validate required parameters
    if (!query || typeof query !== 'string' || query.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
    }

    // Validate price parameters if provided
    if (priceMin !== undefined && (isNaN(priceMin) || priceMin < 0)) {
      res.status(400).json({
        success: false,
        message: 'Minimum price must be a non-negative number',
      });
      return;
    }

    if (priceMax !== undefined && (isNaN(priceMax) || priceMax < 0)) {
      res.status(400).json({
        success: false,
        message: 'Maximum price must be a non-negative number',
      });
      return;
    }

    if (priceMin !== undefined && priceMax !== undefined && priceMin > priceMax) {
      res.status(400).json({
        success: false,
        message: 'Minimum price cannot be greater than maximum price',
      });
      return;
    }

    // Prepare scraper input
    const scraperInput: ScraperInput = {
      query,
      includedBrands,
      excludedBrands,
      priceMin: priceMin !== undefined ? Number(priceMin) : undefined,
      priceMax: priceMax !== undefined ? Number(priceMax) : undefined,
    };

    // Execute search
    const products = await scrapeFashionProducts(scraperInput, retailer);

    // Return results
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Product search error:', error);
    
    res.status(500).json({
      success: false,
      message: 'An error occurred while searching for products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}; 