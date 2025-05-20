import { chromium } from 'playwright';
import { Product, ScraperInput, RetailerSelectors, Retailer } from './types';
import { ASOS, ASOS_SELECTORS } from './retailers';

/**
 * Fashion Product Scraper
 * 
 * Uses Playwright to scrape fashion products from retail websites
 */

/**
 * Scrape fashion products from ASOS based on the provided search criteria
 * 
 * @param input - Search criteria including query, brands, and price range
 * @returns Array of fashion product objects
 */
export async function scrapeAsos(input: ScraperInput): Promise<Product[]> {
  return scrapeRetailer(input, ASOS, ASOS_SELECTORS);
}

/**
 * Generic retailer scraper that can be used for different fashion websites
 * 
 * @param input - Search criteria
 * @param retailer - Retailer configuration
 * @param selectors - CSS selectors for extracting product information
 * @returns Array of fashion product objects
 */
export async function scrapeRetailer(
  input: ScraperInput,
  retailer: Retailer,
  selectors: RetailerSelectors
): Promise<Product[]> {
  const { query, includedBrands, excludedBrands, priceMin, priceMax } = input;
  const MAX_PRODUCTS = 20;

  // Prepare search URL with encoded query
  const searchUrl = retailer.searchUrlPattern.replace(
    '{query}',
    encodeURIComponent(query)
  );

  console.log(`Scraping ${retailer.name} for: "${query}"`);
  console.log(`URL: ${searchUrl}`);

  // Initialize browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set timeout for navigation
  page.setDefaultTimeout(30000);

  try {
    // Navigate to search results page
    await page.goto(searchUrl);
    await page.waitForLoadState('networkidle');

    console.log('Page loaded, extracting products...');

    // Extract products from the page
    const products = await page.$$eval(selectors.productContainer, (elements, selectors) => {
      return elements.slice(0, 20).map(el => {
        const product: any = {};

        // Extract product name
        const nameElement = el.querySelector(selectors.name);
        product.name = nameElement ? nameElement.textContent?.trim() : '';

        // Extract brand name
        const brandElement = el.querySelector(selectors.brand);
        product.brand = brandElement ? brandElement.textContent?.trim() : '';

        // Extract price
        const priceElement = el.querySelector(selectors.price);
        const priceText = priceElement ? priceElement.textContent?.trim() : '';
        // Extract numeric price value
        const priceMatch = priceText.match(/[0-9]+(\.[0-9]+)?/);
        product.price = priceMatch ? parseFloat(priceMatch[0]) : 0;

        // Extract image URL
        const imageElement = el.querySelector(selectors.image) as HTMLImageElement;
        product.image = imageElement?.src || '';
        
        // If there's a srcset, get the highest resolution image
        if (imageElement?.srcset) {
          const srcsetItems = imageElement.srcset.split(',');
          const lastItem = srcsetItems[srcsetItems.length - 1].trim().split(' ')[0];
          if (lastItem) {
            product.image = lastItem;
          }
        }

        // Extract product link
        const linkElement = el.querySelector(selectors.link) as HTMLAnchorElement;
        product.link = linkElement?.href || '';

        // Attempt to extract description if the selector is provided
        if (selectors.description) {
          const descElement = el.querySelector(selectors.description);
          product.description = descElement ? descElement.textContent?.trim() : undefined;
        }

        return product;
      });
    }, selectors as any);

    console.log(`Extracted ${products.length} products, applying filters...`);

    // Apply filters based on input criteria
    const filteredProducts = products.filter(product => {
      // Filter by included brands
      if (includedBrands && includedBrands.length > 0) {
        const brandMatches = includedBrands.some(brand => 
          product.brand.toLowerCase().includes(brand.toLowerCase())
        );
        if (!brandMatches) return false;
      }

      // Filter by excluded brands
      if (excludedBrands && excludedBrands.length > 0) {
        const brandExcluded = excludedBrands.some(brand => 
          product.brand.toLowerCase().includes(brand.toLowerCase())
        );
        if (brandExcluded) return false;
      }

      // Filter by price range
      if (priceMin !== undefined && product.price < priceMin) return false;
      if (priceMax !== undefined && product.price > priceMax) return false;

      return true;
    });

    console.log(`Returning ${filteredProducts.length} products after filtering`);
    
    return filteredProducts.slice(0, MAX_PRODUCTS);
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  } finally {
    // Always close the browser
    await browser.close();
  }
}

/**
 * Main entry point for scraping fashion products
 * 
 * @param input - Search criteria
 * @param retailer - Optional retailer name (defaults to ASOS)
 * @returns Array of fashion products
 */
export async function scrapeFashionProducts(
  input: ScraperInput,
  retailer: string = 'ASOS'
): Promise<Product[]> {
  // Validate input
  if (!input.query || input.query.trim() === '') {
    throw new Error('Search query is required');
  }

  // For now, only ASOS is supported
  return scrapeAsos(input);
} 