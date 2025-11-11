-- Migration: Migrate existing twitter_campaigns data to unified campaigns table
-- Date: 2025-11-10
-- Description: Migrate existing Twitter-specific campaigns to the unified campaigns system

-- First, create a mapping table to track the migration
CREATE TEMP TABLE campaign_id_mapping (
    old_twitter_campaign_id bigint,
    new_campaign_id uuid
);

-- Insert data from twitter_campaigns to campaigns with UUID generation
INSERT INTO campaigns (
    id,
    user_id,
    name,
    keywords,
    platforms,
    status,
    created_at,
    updated_at
)
SELECT
    uuid_generate_v4() as id,
    user_id,
    name,
    niche as keywords,
    ARRAY['twitter'] as platforms,
    CASE
        WHEN status = 'active' THEN 'active'
        WHEN status = 'paused' THEN 'paused'
        ELSE 'completed'
    END as status,
    created_at,
    updated_at
FROM twitter_campaigns;

-- Populate the mapping table
INSERT INTO campaign_id_mapping (old_twitter_campaign_id, new_campaign_id)
SELECT
    tc.id as old_twitter_campaign_id,
    c.id as new_campaign_id
FROM twitter_campaigns tc
JOIN campaigns c ON c.name = tc.name AND c.user_id = tc.user_id
WHERE c.created_at >= (SELECT MAX(created_at) FROM campaigns) - INTERVAL '1 minute';

-- Update posting_queue to use new campaign IDs
UPDATE posting_queue
SET campaign_id = cim.new_campaign_id
FROM campaign_id_mapping cim
WHERE posting_queue.campaign_id = cim.old_twitter_campaign_id;

-- Update twitter_rewrites to use new campaign IDs
UPDATE twitter_rewrites
SET campaign_id = cim.new_campaign_id
FROM campaign_id_mapping cim
WHERE twitter_rewrites.campaign_id = cim.old_twitter_campaign_id;

-- Log the migration results
DO $$
DECLARE
    migrated_count integer;
    total_campaigns integer;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM campaign_id_mapping;
    SELECT COUNT(*) INTO total_campaigns FROM twitter_campaigns;

    RAISE NOTICE 'Migration completed: % campaigns migrated out of % total', migrated_count, total_campaigns;

    -- Verify the migration
    IF migrated_count = total_campaigns THEN
        RAISE NOTICE '✅ Migration successful: All campaigns migrated';
    ELSE
        RAISE EXCEPTION '❌ Migration failed: Only % campaigns migrated out of %', migrated_count, total_campaigns;
    END IF;
END $$;

-- Create a backup view of the old twitter_campaigns data (for rollback if needed)
CREATE OR REPLACE VIEW twitter_campaigns_backup AS
SELECT * FROM twitter_campaigns;

-- Optional: Mark twitter_campaigns as deprecated (don't drop yet, in case of rollback)
-- ALTER TABLE twitter_campaigns RENAME TO twitter_campaigns_deprecated;

-- Update any existing content_posts that reference twitter campaigns
-- This is a complex migration that would need careful analysis of existing data
-- For now, we'll leave content_posts.campaign_id as NULL for existing posts

-- Log completion
SELECT
    'Migration Summary:' as status,
    COUNT(*) as campaigns_migrated,
    (SELECT COUNT(*) FROM campaigns WHERE platforms @> ARRAY['twitter']) as twitter_campaigns_in_new_table,
    (SELECT COUNT(*) FROM posting_queue WHERE campaign_id IS NOT NULL) as posts_with_campaign_refs,
    (SELECT COUNT(*) FROM twitter_rewrites WHERE campaign_id IS NOT NULL) as rewrites_with_campaign_refs
FROM campaign_id_mapping;
