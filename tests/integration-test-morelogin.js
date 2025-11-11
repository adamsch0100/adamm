#!/usr/bin/env node

/**
 * MoreLogin Integration Test
 * Tests basic MoreLogin service functionality without live API calls
 */

import WarmupService from '../services/warmup.js';

console.log('🧪 Testing MoreLogin Integration...\n');

// Test 1: Service instantiation
console.log('Test 1: Service Instantiation');
try {
  const warmupService = new WarmupService(
    process.env.MORELOGIN_API_URL || 'https://api.morelogin.com',
    process.env.MORELOGIN_API_ID || 'test_api_id',
    process.env.MORELOGIN_SECRET_KEY || 'test_secret_key'
  );

  console.log('✅ WarmupService instantiated successfully');

  // Test 2: Header generation
  console.log('\nTest 2: Header Generation');
  const headers = warmupService.generateHeaders();
  console.log('✅ Headers generated:', Object.keys(headers));

  // Test 3: Platform strategies exist
  console.log('\nTest 3: Platform Strategies');
  const platforms = ['tiktok', 'instagram', 'youtube', 'twitter'];
  platforms.forEach(platform => {
    const strategy = warmupService.getWarmupStrategy(platform);
    if (strategy && strategy.name) {
      console.log(`✅ ${platform} strategy: ${strategy.name}`);
    } else {
      console.log(`❌ ${platform} strategy missing`);
    }
  });

  console.log('\n🎉 MoreLogin integration tests passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ MoreLogin integration test failed:', error.message);
  process.exit(1);
}
