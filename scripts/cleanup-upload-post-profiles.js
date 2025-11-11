import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import UploadPostService from '../services/upload-post.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('operator_settings')
    .select('api_key_encrypted')
    .eq('service', 'uploadpost')
    .eq('status', 'configured')
    .single();

  if (error) {
    console.error('Failed to fetch Upload-Post operator settings:', error.message);
    process.exit(1);
  }

  if (!data?.api_key_encrypted) {
    console.error('No Upload-Post API key stored in operator_settings.');
    process.exit(1);
  }

  const apiKey = decrypt(data.api_key_encrypted).trim();
  const uploadPost = new UploadPostService(apiKey);

  try {
    const profiles = await uploadPost.listProfiles();

    if (!profiles?.length) {
      console.log('No Upload-Post profiles found.');
      return;
    }

    console.log(`Found ${profiles.length} profile(s). Removing...`);

    for (const profile of profiles) {
      const username = profile.username || profile.user || profile.id;
      if (!username) {
        console.warn('Skipping profile with no username:', profile);
        continue;
      }

      try {
        if (typeof uploadPost.deleteProfile === 'function') {
          await uploadPost.deleteProfile(username);
        } else {
          const profileKey = profile.profileKey || profile.key || profile.profile_key;
          if (profileKey) {
            await uploadPost.disconnectProfile(profileKey);
          } else {
            console.warn('No profile key available to disconnect for', username);
            continue;
          }
        }
        console.log(`✅ Removed profile ${username}`);
      } catch (disconnectError) {
        console.error(`❌ Failed to remove profile ${username}:`, disconnectError.message);
      }
    }
  } catch (listError) {
    console.error('Failed to list Upload-Post profiles:', listError.message);
    process.exit(1);
  }
}

main();
