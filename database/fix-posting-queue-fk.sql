-- Fix posting_queue foreign key relationship with social_accounts
-- This ensures Supabase can properly join the tables

-- First, check if the column exists and create if not
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
        ELSE
            -- Add the column if it doesn't exist
            ALTER TABLE posting_queue 
            ADD COLUMN social_account_id BIGINT;
        END IF;
    END IF;
END $$;

-- Drop existing foreign key if it exists (might be on account_id)
DO $$ 
BEGIN
    -- Drop foreign key on account_id if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'posting_queue' 
        AND constraint_name LIKE '%account_id%'
    ) THEN
        ALTER TABLE posting_queue 
        DROP CONSTRAINT IF EXISTS posting_queue_account_id_fkey;
    END IF;
END $$;

-- Add foreign key relationship
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'posting_queue' 
        AND constraint_name = 'posting_queue_social_account_id_fkey'
    ) THEN
        ALTER TABLE posting_queue
        ADD CONSTRAINT posting_queue_social_account_id_fkey 
        FOREIGN KEY (social_account_id) 
        REFERENCES social_accounts(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_posting_queue_social_account_id 
ON posting_queue(social_account_id, scheduled_for);

-- Update the relationship in Supabase (refresh schema cache)
-- This will be picked up automatically, but you may need to refresh
SELECT 'Foreign key relationship fixed. You may need to refresh Supabase schema cache.';



