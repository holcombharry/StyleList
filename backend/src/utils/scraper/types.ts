/**
 * Types for the fashion product scraper
 */

// Input parameters for the scraper
export interface ScraperInput {
  query: string;
  includedBrands?: string[];
  excludedBrands?: string[];
  priceMin?: number;
  priceMax?: number;
}

// Product data structure
export interface Product {
  name: string;
  brand: string;
  price: number;
  image: string;
  link: string;
  description?: string;
  availableSizes?: string[];
}

// Retailer information
export interface Retailer {
  name: string;
  baseUrl: string;
  searchUrlPattern: string;
}

// Retailer-specific selectors
export interface RetailerSelectors {
  productContainer: string;
  name: string;
  brand: string;
  price: string;
  image: string;
  link: string;
  description?: string;
  sizes?: string;
} 