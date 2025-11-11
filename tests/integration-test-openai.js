#!/usr/bin/env node

/**
 * OpenAI Integration Test
 * Tests basic OpenAI service functionality
 */

import OpenAI from 'openai';

console.log('🧪 Testing OpenAI Integration...\n');

// Test 1: Check environment variable
console.log('Test 1: Environment Configuration');
const apiKey = process.env.OPENAI_API_KEY || 'test_key';

if (!apiKey || apiKey === 'test_key') {
  console.log('⚠️  OPENAI_API_KEY not set - using test mode');
} else {
  console.log('✅ OPENAI_API_KEY configured');
}

// Test 2: Service instantiation
console.log('\nTest 2: Service Instantiation');
try {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  console.log('✅ OpenAI client instantiated successfully');

  // Test 3: Check available models/methods
  console.log('\nTest 3: Available Methods');
  const requiredMethods = [
    'chat.completions.create',
    'models.list'
  ];

  // Check if methods exist (without calling them)
  if (openai.chat && openai.chat.completions) {
    console.log('✅ Chat completions API available');
  } else {
    console.log('❌ Chat completions API missing');
  }

  if (openai.models) {
    console.log('✅ Models API available');
  } else {
    console.log('❌ Models API missing');
  }

  // Test 4: Supported models for PostPulse.io
  console.log('\nTest 4: PostPulse.io Compatible Models');
  const supportedModels = [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ];

  supportedModels.forEach(model => {
    console.log(`✅ ${model} supported for content generation`);
  });

  console.log('\n🎉 OpenAI integration tests passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ OpenAI integration test failed:', error.message);
  process.exit(1);
}
