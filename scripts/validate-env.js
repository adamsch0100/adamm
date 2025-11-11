#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates all required environment variables for PostPulse.io production
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: resolve(__dirname, '..', '.env') });

console.log('🔍 Validating PostPulse.io Environment Variables...\n');

// Required environment variables by category
// NOTE: Most API keys are now stored in Supabase operator_settings table
const requiredVars = {
  'Supabase': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  'Security': [
    'ENCRYPTION_KEY'
  ]
};

const optionalVars = {
  'Legacy API Keys': [
    'MORELOGIN_API_ID',
    'MORELOGIN_SECRET_KEY',
    'OPENAI_API_KEY',
    'UPLOAD_POST_API_KEY',
    'WHOP_API_KEY'
  ],
  'n8n': ['N8N_WEBHOOK_URL'],
  'Google Sheets': ['GOOGLE_SHEETS_API_KEY'],
  'Monitoring': ['SENTRY_DSN'],
  'Email': ['ALERT_EMAIL']
};

// Supabase-stored API keys that should be validated
const supabaseStoredKeys = {
  'morelogin': ['API ID', 'Secret Key'],
  'openai': ['API Key'],
  'uploadpost': ['API Key'],
  'whop': ['API Key'],
  'google': ['API Key'],
  'coinmarketcap': ['API Key']
};

let allValid = true;
const missingVars = [];
const invalidVars = [];

// Check required variables
console.log('📋 Checking REQUIRED variables:');
Object.entries(requiredVars).forEach(([category, vars]) => {
  console.log(`\n🔸 ${category}:`);
  vars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
      console.log(`  ❌ ${varName} - MISSING`);
      missingVars.push(varName);
      allValid = false;
    } else if (value.includes('your_') || value.includes('test') || value === '') {
      console.log(`  ⚠️  ${varName} - INVALID (placeholder value)`);
      invalidVars.push(varName);
      allValid = false;
    } else {
      console.log(`  ✅ ${varName} - SET`);
    }
  });
});

// Check Supabase-stored API keys
console.log('\n📋 Checking SUPABASE-STORED API keys:');
console.log('🔸 Note: These should be configured in Supabase operator_settings table');
Object.entries(supabaseStoredKeys).forEach(([service, keys]) => {
  console.log(`\n🔸 ${service}:`);
  keys.forEach(keyType => {
    console.log(`  ℹ️  ${keyType} - Should be configured in Supabase operator_settings`);
  });
});
console.log('\n💡 To verify Supabase API keys, run this SQL in Supabase:');
console.log('   SELECT service, status, last_verified FROM operator_settings ORDER BY service;');

// Check optional variables
console.log('\n📋 Checking OPTIONAL variables:');
Object.entries(optionalVars).forEach(([category, vars]) => {
  console.log(`\n🔸 ${category}:`);
  vars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
      console.log(`  ⭕ ${varName} - NOT SET (optional)`);
    } else if (value.includes('your_') || value.includes('test') || value === '') {
      console.log(`  ⚠️  ${varName} - INVALID (placeholder value)`);
      invalidVars.push(varName);
    } else {
      console.log(`  ✅ ${varName} - SET`);
    }
  });
});

// Additional validations
console.log('\n🔍 Additional Validations:');

// Check Supabase URL format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
  allValid = false;
}

// Check if URLs are HTTPS in production
const productionUrls = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'N8N_WEBHOOK_URL'
];

productionUrls.forEach(varName => {
  const value = process.env[varName];
  if (value && !value.startsWith('https://') && !value.includes('localhost')) {
    console.log(`⚠️  ${varName} should use HTTPS in production`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (allValid) {
  console.log('🎉 ALL VALIDATIONS PASSED!');
  console.log('✅ Environment is ready for production deployment');
} else {
  console.log('❌ VALIDATION FAILED');
  console.log('\nMissing required variables:');
  missingVars.forEach(v => console.log(`  - ${v}`));

  if (invalidVars.length > 0) {
    console.log('\nVariables with placeholder values:');
    invalidVars.forEach(v => console.log(`  - ${v}`));
  }

  console.log('\n🔧 To fix:');
  console.log('1. Set all missing required variables');
  console.log('2. Replace placeholder values with actual API keys/URLs');
  console.log('3. Ensure all URLs use HTTPS in production');
  console.log('4. Run this script again to validate');

  process.exit(1);
}

// Production recommendations
console.log('\n💡 PRODUCTION RECOMMENDATIONS:');
console.log('• Ensure all API keys have appropriate rate limits');
console.log('• Set up monitoring for API usage and errors');
console.log('• Configure backup strategies for critical data');
console.log('• Review and test rate limiting settings');
console.log('• Set up alerting for service failures');

console.log('\n✅ Environment validation complete!');
process.exit(0);
