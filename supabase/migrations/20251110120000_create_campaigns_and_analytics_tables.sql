-- Migration: Create unified campaigns and analytics tables
-- Date: 2025-11-10
-- Description: Add missing core tables to align with PostPulse.io PRD requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create unified campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  keywords text,
  topics text,
  platforms text[] DEFAULT '{}',
  content_json jsonb DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics table for tracking post performance
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id bigint REFERENCES content_posts(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  platform text NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_post_id ON analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_recorded_at ON analytics(recorded_at DESC);

-- Enable RLS on new tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns table
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;

CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analytics table
DROP POLICY IF EXISTS "Users can view analytics for their campaigns" ON analytics;
DROP POLICY IF EXISTS "Users can insert analytics for their campaigns" ON analytics;

CREATE POLICY "Users can view analytics for their campaigns" ON analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for their campaigns" ON analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = analytics.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to campaigns table
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for campaign analytics summary
CREATE OR REPLACE VIEW campaign_analytics_summary AS
SELECT
  c.id as campaign_id,
  c.name as campaign_name,
  c.user_id,
  c.status as campaign_status,
  COUNT(DISTINCT a.post_id) as total_posts,
  SUM(a.impressions) as total_impressions,
  SUM(a.clicks) as total_clicks,
  SUM(a.conversions) as total_conversions,
  SUM(a.revenue) as total_revenue,
  AVG(CASE WHEN a.impressions > 0 THEN (a.clicks::float / a.impressions) * 100 ELSE 0 END) as avg_ctr,
  MAX(a.recorded_at) as last_analytics_update
FROM campaigns c
LEFT JOIN analytics a ON c.id = a.campaign_id
GROUP BY c.id, c.name, c.user_id, c.status;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON campaigns TO authenticated;
GRANT SELECT, INSERT ON analytics TO authenticated;
GRANT SELECT ON campaign_analytics_summary TO authenticated;
