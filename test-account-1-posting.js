import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import UploadPostService from './services/upload-post.js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Decryption
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

async function testPosting() {
  console.log('🧪 Testing Account 1 (slcfcgeaofxg) posting...\n');

  // Get API key
  const { data: apiKeyData } = await supabase
    .from('operator_settings')
    .select('api_key_encrypted')
    .eq('service', 'uploadpost')
    .in('status', ['configured', 'active'])
    .single();

  const decryptedKey = decrypt(apiKeyData.api_key_encrypted);
  const uploadPost = new UploadPostService(decryptedKey);

  // Test tweet text
  const testTweet = "🧪 Testing Upload-Post API integration! This is a test tweet from the automation system. #AISideHustles";

  console.log(`📝 Test tweet: "${testTweet}"`);
  console.log(`📋 Using username: slcfcgeaofxg (as 'user' parameter)\n`);

  try {
    // Test posting using User Profile Integration API
    const result = await uploadPost.postTextOnly({
      text: testTweet,
      username: 'slcfcgeaofxg', // Username IS the profile key
      platform: 'x' // or 'twitter'
    });

    console.log('✅ POSTING SUCCESS!');
    console.log('\n📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Check Twitter account @slcfcgeaofxg - tweet should appear!');

  } catch (error) {
    console.error('❌ POSTING FAILED:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\nFull error:', error);
  }
}

testPosting().catch(console.error);

