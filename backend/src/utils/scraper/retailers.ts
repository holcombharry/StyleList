import { Retailer, RetailerSelectors } from './types';

/**
 * Retailer configurations for supported fashion websites
 */

// ASOS retailer information
export const ASOS: Retailer = {
  name: 'ASOS',
  baseUrl: 'https://www.asos.com',
  searchUrlPattern: 'https://www.asos.com/search/?q={query}',
};

// ASOS selectors for product information
export const ASOS_SELECTORS: RetailerSelectors = {
  productContainer: '[data-auto-id="productTile"]',
  name: '[data-auto-id="productTileDescription"]',
  brand: '[data-auto-id="brandDescription"]',
  price: '[data-auto-id="productTilePrice"]',
  image: 'img[data-auto-id="productTileImage"]',
  link: 'a[data-auto-id="productTileLink"]',
};

// Map of supported retailers
export const RETAILERS: Record<string, Retailer> = {
  ASOS,
};

// Map of retailer selectors
export const RETAILER_SELECTORS: Record<string, RetailerSelectors> = {
  ASOS: ASOS_SELECTORS,
}; 