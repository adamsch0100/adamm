-- ============================================================================
-- FIX POSTING QUEUE FOREIGN KEY RELATIONSHIP
-- Run this in Supabase SQL Editor to fix the relationship errors
-- ============================================================================

-- Step 1: Ensure social_account_id column exists (or rename from account_id)
DO $$ 
BEGIN
    -- Check if social_account_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posting_queue' 
        AND column_name = 'social_account_id'
    ) THEN
        -- Check if account_id exists (old name)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posting_queue' 
            AND column_name = 'account_id'
        ) THEN
            -- Rename account_id to social_account_id
            ALTER TABLE posting_queue 
            RENAME COLUMN account_id TO social_account_id;
            RAISE NOTICE 'Renamed account_id to social_account_id';
        ELSE
            -- Add the column if it doesn't exist
            ALTER TABLE posting_queue 
            ADD COLUMN social_account_id BIGINT;
            RAISE NOTICE 'Added social_account_id column';
        END IF;
    END IF;
END $$;

-- Step 2: Drop any existing foreign key constraints (might be on old column name)
ALTER TABLE posting_queue 
DROP CONSTRAINT IF EXISTS posting_queue_account_id_fkey;

ALTER TABLE posting_queue 
DROP CONSTRAINT IF EXISTS posting_queue_social_account_id_fkey;

-- Step 3: Add the foreign key relationship
ALTER TABLE posting_queue
ADD CONSTRAINT posting_queue_social_account_id_fkey 
FOREIGN KEY (social_account_id) 
REFERENCES social_accounts(id) 
ON DELETE CASCADE;

-- Step 4: Create/update index for performance
DROP INDEX IF EXISTS idx_posting_queue_social_account_id;
CREATE INDEX idx_posting_queue_social_account_id 
ON posting_queue(social_account_id, scheduled_for);

-- Step 5: Verify it worked
SELECT 
    '✅ Foreign key relationship created successfully!' as status,
    COUNT(*) as posts_in_queue
FROM posting_queue;



