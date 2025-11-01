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

async function fetchConnectedAccounts() {
  console.log('🔍 Fetching connected accounts from Upload-Post...\n');

  // Get API key
  const { data: apiKeyData } = await supabase
    .from('operator_settings')
    .select('api_key_encrypted')
    .eq('service', 'uploadpost')
    .in('status', ['configured', 'active'])
    .single();

  const decryptedKey = decrypt(apiKeyData.api_key_encrypted);
  const uploadPost = new UploadPostService(decryptedKey);

  try {
    const profiles = await uploadPost.getUserProfiles();
    
    console.log('Raw API response:', JSON.stringify(profiles, null, 2));
    
    // Handle different response formats
    const profilesList = Array.isArray(profiles) ? profiles : 
                        (profiles.profiles || profiles.users || []);
    
    console.log(`\n✅ Found ${profilesList.length} profile(s):\n`);
    
    const accountInfo = [];
    
    for (const profile of profilesList) {
      console.log(`📋 Profile: ${profile.username || profile.name}`);
      console.log(`   Full data:`, JSON.stringify(profile, null, 2));
      
      // With User Profile Integration API, the username IS the profile key
      const profileUsername = profile.username;
      const socialAccounts = profile.social_accounts || {};
      
      console.log(`   Profile Key (use as 'user' in API): ${profileUsername}`);
      console.log(`   Connected accounts:`);
      
      const connectedPlatforms = [];
      
      for (const [platform, accountData] of Object.entries(socialAccounts)) {
        if (accountData && (accountData !== '' || typeof accountData === 'object')) {
          const isConnected = typeof accountData === 'object' && accountData !== null;
          console.log(`   - ${platform}: ${isConnected ? '✅ Connected' : '❌ Not connected'}`);
          if (isConnected && accountData.display_name) {
            console.log(`     Display Name: ${accountData.display_name}`);
          }
          
          if (isConnected) {
            connectedPlatforms.push(platform);
            accountInfo.push({
              profileUsername: profileUsername,
              platform: platform,
              profileKey: profileUsername, // Username is the profile key
              displayName: accountData.display_name
            });
          }
        }
      }
      
      if (connectedPlatforms.length === 0) {
        console.log(`   ⚠️ No accounts connected yet`);
      }
      
      console.log('');
    }
    
    if (accountInfo.length > 0) {
      console.log('\n📝 PROFILE KEYS TO USE:\n');
      accountInfo.forEach((info, i) => {
        console.log(`${i + 1}. ${info.profileUsername} → ${info.platform}: ${info.profileKey || 'Key not shown'}`);
      });
    }
    
    return accountInfo;
    
  } catch (error) {
    console.error('❌ Error fetching profiles:', error.message);
    console.error('Full error:', error);
  }
}

fetchConnectedAccounts().catch(console.error);

