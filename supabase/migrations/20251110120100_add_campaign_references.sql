-- Migration: Add campaign references to existing tables
-- Date: 2025-11-10
-- Description: Add campaign_id foreign keys to leads and content_posts tables

-- Add campaign_id to leads table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads'
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added campaign_id column to leads table';
    ELSE
        RAISE NOTICE 'campaign_id column already exists in leads table';
    END IF;
END $$;

-- Add campaign_id to content_posts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_posts'
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE content_posts ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added campaign_id column to content_posts table';
    ELSE
        RAISE NOTICE 'campaign_id column already exists in content_posts table';
    END IF;
END $$;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_campaign_id ON content_posts(campaign_id);

-- Update RLS policies for leads table to include campaign-based access
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;

CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own leads" ON leads
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = leads.campaign_id
      AND campaigns.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = leads.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Update RLS policies for content_posts table to include campaign-based access
DROP POLICY IF EXISTS "Users can view their own posts" ON content_posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON content_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON content_posts;

CREATE POLICY "Users can view their own posts" ON content_posts
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = content_posts.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own posts" ON content_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (campaign_id IS NULL OR EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = content_posts.campaign_id
      AND campaigns.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own posts" ON content_posts
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = content_posts.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create a function to automatically set campaign_id based on context
CREATE OR REPLACE FUNCTION set_campaign_context()
RETURNS TRIGGER AS $$
BEGIN
    -- If campaign_id is not set and we have a user_id, try to find the most recent active campaign
    IF NEW.campaign_id IS NULL AND NEW.user_id IS NOT NULL THEN
        SELECT id INTO NEW.campaign_id
        FROM campaigns
        WHERE user_id = NEW.user_id
        AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically set campaign context (optional - can be enabled later)
-- DROP TRIGGER IF EXISTS set_lead_campaign_context ON leads;
-- CREATE TRIGGER set_lead_campaign_context
--     BEFORE INSERT ON leads
--     FOR EACH ROW
--     EXECUTE FUNCTION set_campaign_context();

-- DROP TRIGGER IF EXISTS set_post_campaign_context ON content_posts;
-- CREATE TRIGGER set_post_campaign_context
--     BEFORE INSERT ON content_posts
--     FOR EACH ROW
--     EXECUTE FUNCTION set_campaign_context();

-- Grant permissions for the new columns
GRANT UPDATE (campaign_id) ON leads TO authenticated;
GRANT UPDATE (campaign_id) ON content_posts TO authenticated;
