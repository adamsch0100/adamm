-- Rollback script for PostPulse.io schema migrations
-- Use this only if migrations fail and you need to revert changes
-- Date: 2025-11-10

-- WARNING: This script will remove the new tables and data
-- Make sure to backup your database before running migrations

-- Rollback migration 20251110120300_add_account_integration_fields.sql
DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of account integration fields...';

    -- Remove the foreign key constraint if it exists
    ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS fk_social_accounts_cloud_phone;

    -- Remove the new columns (they will be dropped with CASCADE if they have dependencies)
    ALTER TABLE social_accounts
    DROP COLUMN IF EXISTS upload_post_profile_key CASCADE,
    DROP COLUMN IF EXISTS upload_post_connected CASCADE,
    DROP COLUMN IF EXISTS cloud_phone_id CASCADE,
    DROP COLUMN IF EXISTS verification_status CASCADE,
    DROP COLUMN IF EXISTS warmup_days CASCADE,
    DROP COLUMN IF EXISTS warmup_completed CASCADE,
    DROP COLUMN IF EXISTS email CASCADE,
    DROP COLUMN IF EXISTS phone_number CASCADE,
    DROP COLUMN IF EXISTS password_encrypted CASCADE,
    DROP COLUMN IF EXISTS following_count CASCADE,
    DROP COLUMN IF EXISTS posts_count CASCADE,
    DROP COLUMN IF EXISTS engagement_rate CASCADE,
    DROP COLUMN IF EXISTS profile_data CASCADE,
    DROP COLUMN IF EXISTS display_name CASCADE;

    RAISE NOTICE 'Account integration fields removed';
END $$;

-- Rollback migration 20251110120200_migrate_twitter_campaigns_data.sql
DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of data migration...';

    -- Revert posting_queue campaign_id references
    UPDATE posting_queue SET campaign_id = NULL WHERE campaign_id IS NOT NULL;

    -- Revert twitter_rewrites campaign_id references
    UPDATE twitter_rewrites SET campaign_id = NULL WHERE campaign_id IS NOT NULL;

    RAISE NOTICE 'Data references reverted';
END $$;

-- Rollback migration 20251110120100_add_campaign_references.sql
DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of campaign references...';

    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS set_lead_campaign_context ON leads;
    DROP TRIGGER IF EXISTS set_post_campaign_context ON content_posts;

    -- Drop the helper function
    DROP FUNCTION IF EXISTS set_campaign_context();

    -- Remove campaign_id columns (with CASCADE to handle constraints)
    ALTER TABLE leads DROP COLUMN IF EXISTS campaign_id CASCADE;
    ALTER TABLE content_posts DROP COLUMN IF EXISTS campaign_id CASCADE;

    -- Restore original RLS policies
    DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
    DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
    DROP POLICY IF EXISTS "Users can update their own leads" ON leads;

    CREATE POLICY "Users can view their own leads" ON leads
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own leads" ON leads
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own leads" ON leads
      FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view their own posts" ON content_posts;
    DROP POLICY IF EXISTS "Users can insert their own posts" ON content_posts;
    DROP POLICY IF EXISTS "Users can update their own posts" ON content_posts;

    CREATE POLICY "Users can view their own posts" ON content_posts
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own posts" ON content_posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own posts" ON content_posts
      FOR UPDATE USING (auth.uid() = user_id);

    RAISE NOTICE 'Campaign references removed and policies restored';
END $$;

-- Rollback migration 20251110120000_create_campaigns_and_analytics_tables.sql
DO $$
BEGIN
    RAISE NOTICE 'Starting rollback of core tables...';

    -- Drop the view first
    DROP VIEW IF EXISTS campaign_analytics_summary;

    -- Drop analytics table
    DROP TABLE IF EXISTS analytics CASCADE;

    -- Drop campaigns table
    DROP TABLE IF EXISTS campaigns CASCADE;

    -- Drop the trigger function
    DROP FUNCTION IF EXISTS update_updated_at_column();

    RAISE NOTICE 'Core tables and functions removed';
END $$;

-- Verify rollback completion
SELECT
    'Rollback completed successfully' as status,
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name IN ('campaigns', 'analytics')
        AND table_schema = 'public'
    ) THEN '✅ Tables removed' ELSE '❌ Tables still exist' END as tables_status,
    CASE WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name IN ('leads', 'content_posts')
        AND column_name = 'campaign_id'
        AND table_schema = 'public'
    ) THEN '✅ Columns removed' ELSE '❌ Columns still exist' END as columns_status;
