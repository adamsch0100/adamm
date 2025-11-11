-- Social accounts for multi-platform posting
CREATE TABLE IF NOT EXISTS social_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'tiktok', 'instagram'
  username TEXT NOT NULL,
  display_name TEXT,
  auth_data JSONB, -- Store cookies, tokens, etc (encrypted)
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'banned', 'rate_limited'
  daily_post_limit INTEGER DEFAULT 20,
  posts_today INTEGER DEFAULT 0,
  last_post_at TIMESTAMPTZ,
  followers_count INTEGER DEFAULT 0,
  bio_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update posting_queue to link to accounts
ALTER TABLE posting_queue 
  ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES social_accounts(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform 
  ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status 
  ON social_accounts(status);
CREATE INDEX IF NOT EXISTS idx_posting_queue_account 
  ON posting_queue(account_id, scheduled_for);

-- RLS policies
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON social_accounts;

CREATE POLICY "Users can view their own accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id);
