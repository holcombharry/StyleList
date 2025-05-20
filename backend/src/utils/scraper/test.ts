import { scrapeFashionProducts } from './fashionScraper';
import { ScraperInput } from './types';

/**
 * Test script for the fashion product scraper
 */

async function runTest() {
  try {
    // Test query for minimal streetwear
    const input: ScraperInput = {
      query: 'minimalist streetwear hoodie',
      includedBrands: ['Nike', 'Adidas', 'Puma'],
      excludedBrands: ['H&M'],
      priceMin: 20,
      priceMax: 100,
    };

    console.log('Running fashion product scraper test:');
    console.log('Query:', input.query);
    console.log('Included brands:', input.includedBrands);
    console.log('Excluded brands:', input.excludedBrands);
    console.log('Price range:', `$${input.priceMin} - $${input.priceMax}`);
    console.log('--------------------------------------');

    const results = await scrapeFashionProducts(input);
    
    console.log(`Found ${results.length} matching products:`);
    console.log('--------------------------------------');
    
    results.forEach((product, i) => {
      console.log(`Product ${i + 1}:`);
      console.log(`- Name: ${product.name}`);
      console.log(`- Brand: ${product.brand}`);
      console.log(`- Price: $${product.price.toFixed(2)}`);
      console.log(`- Image: ${product.image}`);
      console.log(`- Link: ${product.link}`);
      if (product.description) {
        console.log(`- Description: ${product.description}`);
      }
      if (product.availableSizes) {
        console.log(`- Sizes: ${product.availableSizes.join(', ')}`);
      }
      console.log('--------------------------------------');
    });

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest(); 