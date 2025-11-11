-- Add integration fields to social_accounts table
-- This migration adds fields for Upload-Post and MoreLogin integration

ALTER TABLE social_accounts
ADD COLUMN IF NOT EXISTS upload_post_profile_key TEXT,
ADD COLUMN IF NOT EXISTS upload_post_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cloud_phone_id BIGINT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS warmup_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS warmup_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS password_encrypted TEXT,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS posts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add foreign key constraint for cloud_phone_id if MoreLogin devices table exists
-- This is optional and will be added when the devices table is implemented
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cloud_phones') THEN
    ALTER TABLE social_accounts
    ADD CONSTRAINT fk_social_accounts_cloud_phone
    FOREIGN KEY (cloud_phone_id) REFERENCES cloud_phones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_social_accounts_upload_post_key
ON social_accounts(upload_post_profile_key) WHERE upload_post_profile_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_accounts_cloud_phone
ON social_accounts(cloud_phone_id) WHERE cloud_phone_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_accounts_verification_status
ON social_accounts(verification_status);

-- Update RLS policies to include the new fields (no changes needed as they use user_id)

-- Add comments for documentation
COMMENT ON COLUMN social_accounts.upload_post_profile_key IS 'Profile key from Upload-Post API for account linking';
COMMENT ON COLUMN social_accounts.upload_post_connected IS 'Whether this account is successfully connected to Upload-Post';
COMMENT ON COLUMN social_accounts.cloud_phone_id IS 'Reference to MoreLogin cloud phone/device for automation';
COMMENT ON COLUMN social_accounts.verification_status IS 'Account verification status: unverified, pending, verified, failed';
COMMENT ON COLUMN social_accounts.warmup_days IS 'Number of days account has been warming up';
COMMENT ON COLUMN social_accounts.warmup_completed IS 'Whether account warmup process is completed';
COMMENT ON COLUMN social_accounts.email IS 'Account email for login/authentication';
COMMENT ON COLUMN social_accounts.phone_number IS 'Account phone number for verification';
COMMENT ON COLUMN social_accounts.password_encrypted IS 'Encrypted password for account access';
COMMENT ON COLUMN social_accounts.following_count IS 'Number of accounts this account follows';
COMMENT ON COLUMN social_accounts.posts_count IS 'Total number of posts by this account';
COMMENT ON COLUMN social_accounts.engagement_rate IS 'Account engagement rate as percentage';
COMMENT ON COLUMN social_accounts.profile_data IS 'Additional profile data from social platforms';
COMMENT ON COLUMN social_accounts.display_name IS 'Display name/username for the account';
