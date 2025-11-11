import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Account mappings from Upload-Post profiles
const ACCOUNTS = [
  { 
    email: 'slcfcgeaofxg@onlyrugs.fun', 
    username: 'slcfcgeaofxg',
    uploadPostUsername: 'slcfcgeaofxg',
    hasTwitter: true,
    hasTikTok: false
  },
  { 
    email: 'rjpgxtinfatk@onlyrugs.fun', 
    username: 'rjpgxtinfatk',
    uploadPostUsername: 'rjpgxtinfatk',
    hasTwitter: false,
    hasTikTok: false
  },
  { 
    email: 'bxfhrlsvmnzt@onlyrugs.fun', 
    username: 'bxfhrlsvmnzt',
    uploadPostUsername: 'bxfhrlsvmnzt',
    hasTwitter: false,
    hasTikTok: false
  },
  { 
    email: 'adam@saahomes.com', 
    username: 'adam',
    uploadPostUsername: 'adam',
    hasTwitter: false,
    hasTikTok: false
  }
];

async function addAccounts() {
  console.log('📝 Adding accounts to dashboard...\n');

  // Get first user (or use a specific user ID)
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users || users.users.length === 0) {
    console.error('❌ No users found. Please log in first.');
    process.exit(1);
  }

  const userId = users.users[0].id;
  console.log(`Using user ID: ${userId}\n`);

  for (const account of ACCOUNTS) {
    try {
      // Store upload-post username as profile key (username IS the key with User Profile Integration)
      const authData = {};
      
      if (account.hasTwitter) {
        authData.uploadpost_profile_key_twitter = account.uploadPostUsername;
      }
      if (account.hasTikTok) {
        authData.uploadpost_profile_key_tiktok = account.uploadPostUsername;
      }

      const { data, error } = await supabase
        .from('social_accounts')
        .insert({
          user_id: userId,
          platform: account.hasTwitter && account.hasTikTok ? 'both' : (account.hasTwitter ? 'twitter' : 'twitter'), // Default to twitter for now
          username: account.username,
          display_name: `AI Hustles ${account.username}`,
          auth_data: authData,
          bio_link: 'https://whop.com/ai-side-hustles/', // Your Whop link
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Duplicate key
          console.log(`⚠️ Account ${account.username} already exists, skipping...`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Added: ${account.username} (${account.email})`);
        if (account.hasTwitter) {
          console.log(`   Twitter Profile Key: ${account.uploadPostUsername}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error adding ${account.username}:`, error.message);
    }
  }

  console.log('\n✅ Done! Check http://localhost:3001/dashboard/accounts');
}

addAccounts().catch(console.error);



