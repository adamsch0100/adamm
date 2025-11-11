import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import UploadPostService from './services/upload-post.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Your 4 Twitter accounts
const ACCOUNTS = [
  { email: 'slcfcgeaofxg@onlyrugs.fun', username: 'slcfcgeaofxg' },
  { email: 'rjpgxtinfatk@onlyrugs.fun', username: 'rjpgxtinfatk' },
  { email: 'bxfhrlsvmnzt@onlyrugs.fun', username: 'bxfhrlsvmnzt' },
  { email: 'adam@saahomes.com', username: 'adam' }
];

// Decryption (same as mcp-server.js)
function decrypt(encryptedText) {
  const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const encryptedBuffer = Buffer.from(encryptedText, 'base64');
  const keyBuffer = Buffer.from(key, 'utf8');
  const decrypted = Buffer.alloc(encryptedBuffer.length);
  
  for (let i = 0; i < encryptedBuffer.length; i++) {
    decrypted[i] = encryptedBuffer[i] ^ keyBuffer[i % keyBuffer.length];
  }
  
  return decrypted.toString('utf8');
}

async function setupAccounts() {
  console.log('🚀 Setting up Upload-Post accounts via User Profile Integration API...\n');

  // Get Upload-Post API key
  const { data: apiKeyData, error: keyError } = await supabase
    .from('operator_settings')
    .select('api_key_encrypted')
    .eq('service', 'uploadpost')
    .in('status', ['configured', 'active'])
    .single();

  if (keyError || !apiKeyData) {
    console.error('❌ Upload-Post API key not found in operator_settings');
    process.exit(1);
  }

  // Decrypt the API key
  const decryptedKey = decrypt(apiKeyData.api_key_encrypted);
  console.log(`✅ API Key loaded (decrypted)\n`);

  const uploadPost = new UploadPostService(decryptedKey);
  const jwtUrls = [];

  for (const account of ACCOUNTS) {
    try {
      console.log(`\n📝 Setting up: ${account.username} (${account.email})`);
      
      // Step 1: Create user profile
      console.log('  1. Creating user profile...');
      const profile = await uploadPost.createUserProfile(account.username);
      console.log(`     ✅ Profile ${profile.alreadyExists ? 'already exists' : 'created'}: ${account.username}`);

      // Step 2: Generate JWT URL
      console.log('  2. Generating JWT connection URL...');
      const jwtResult = await uploadPost.generateJwtUrl(account.username, {
        redirect_url: 'http://localhost:3001/dashboard/accounts?connected=true',
        platforms: ['x', 'tiktok'] // Show Twitter/X and TikTok
      });
      
      jwtUrls.push({
        email: account.email,
        username: account.username,
        url: jwtResult.access_url
      });
      
      console.log(`     ✅ JWT URL generated`);
      console.log(`     🔗 ${jwtResult.access_url}`);

    } catch (error) {
      console.error(`  ❌ Error setting up ${account.username}:`, error.message);
    }
  }

  console.log('\n\n✅ SETUP COMPLETE!\n');
  console.log('📋 CONNECTION URLs (click each to connect accounts):\n');
  
  jwtUrls.forEach((item, index) => {
    console.log(`${index + 1}. ${item.username} (${item.email}):`);
    console.log(`   ${item.url}\n`);
  });

  console.log('\n📝 NEXT STEPS:');
  console.log('1. Click each URL above to connect Twitter/X account');
  console.log('2. After connecting, come back and we\'ll fetch the profile keys');
  console.log('3. Then add accounts to your dashboard\n');
}

setupAccounts().catch(console.error);

