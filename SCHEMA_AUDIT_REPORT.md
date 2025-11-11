# PostPulse.io Schema Audit Report

## Executive Summary

Current database schema is **partially aligned** with PRD requirements. Core functionality exists but major structural gaps exist that prevent unified multi-platform campaign management.

## Current Schema vs PRD Requirements

### ✅ Tables That Exist and Align

#### 1. Users (profiles table)
**PRD Requirement:**
- id (UUID), email, role (admin/user), created_at

**Current Implementation:**
- ✅ id (uuid), email, full_name, company_name, created_at
- ✅ is_admin (boolean) for role management
- ✅ Stripe integration fields (subscription_status, subscription_plan)
- ✅ upload_post_username field

**Status:** ✅ FULLY ALIGNED

#### 2. Leads (leads table)
**PRD Requirement:**
- id (UUID), campaign_id (FK), email, source (Typeform/ConvertKit), created_at

**Current Implementation:**
- ✅ id (bigint), user_id (FK), email, trigger_keyword, captured_at
- ✅ social_account_id (FK), platform, username
- ✅ dm_sent, converted, revenue tracking
- ❌ Missing campaign_id (only has user_id and social_account_id)

**Status:** ⚠️ MOSTLY ALIGNED - needs campaign_id reference

#### 3. Posts (content_posts table)
**PRD Requirement:**
- id (UUID), campaign_id (FK), account_id (FK), media_url, platform_post_id, status, posted_at

**Current Implementation:**
- ✅ id (bigint), user_id (FK), video_url, thumbnail_url, status, posted_at
- ✅ target_platforms (array), upload_post_ids (jsonb), upload_post_errors (jsonb)
- ✅ Comprehensive metrics: total_views, total_likes, total_comments, total_shares
- ✅ platform_metrics (jsonb) for detailed analytics
- ❌ No campaign_id reference
- ❌ No account_id reference (only user_id)

**Status:** ⚠️ PARTIALLY ALIGNED - needs campaign and account relationships

#### 4. Posting Queue (posting_queue table)
**PRD Implied:**
- Queue system for scheduled posting

**Current Implementation:**
- ✅ id (bigint), user_id (FK), platform, content, scheduled_for, status
- ✅ social_account_id (FK), campaign_id (bigint FK to twitter_campaigns)
- ✅ priority, retry_count, error_message, content_data (jsonb)
- ✅ Proper indexing and relationships

**Status:** ✅ COMPREHENSIVE IMPLEMENTATION

#### 5. Social Accounts (social_accounts table)
**PRD Equivalent:** accounts table
- Links campaigns to social media accounts

**Current Implementation:**
- ✅ Supports ALL platforms: tiktok, instagram, youtube, facebook, linkedin, twitter
- ✅ user_id (FK), platform, username, email, phone_number
- ✅ password_encrypted, upload_post_profile_key, upload_post_connected
- ✅ Status tracking: status, verification_status, warmup_days, warmup_completed
- ✅ Metrics: followers_count, following_count, posts_count, engagement_rate
- ✅ Daily limits: daily_post_limit, posts_today, last_post_at
- ✅ Advanced features: cloud_phone_id, auth_data (jsonb), profile_data (jsonb)

**Status:** ✅ EXCEEDS PRD REQUIREMENTS - very comprehensive

### ❌ Critical Missing Tables

#### 1. Campaigns Table (MISSING)
**PRD Requirement:**
- id (UUID), user_id (FK), keywords (text), topics (text), content_json (JSON), status, created_at

**Current Reality:**
- ❌ No unified campaigns table exists
- ❌ Only `twitter_campaigns` exists (platform-specific)
- ❌ Cannot create campaigns that work across multiple platforms

**Impact:** BLOCKING - Core functionality missing

#### 2. Analytics Table (MISSING)
**PRD Requirement:**
- id (UUID), post_id (FK), impressions, clicks, conversions, revenue, recorded_at

**Current Reality:**
- ❌ No dedicated analytics table
- ❌ Analytics data scattered in content_posts.platform_metrics (jsonb)
- ❌ No structured way to track impressions, clicks, conversions per post/campaign

**Impact:** MAJOR GAP - Analytics functionality incomplete

### ⚠️ Schema Issues Requiring Migration

#### 1. ID Type Inconsistency
- **Issue:** Current tables use `bigint` auto-incrementing IDs, PRD specifies `uuid`
- **Impact:** Foreign key relationships may be inconsistent
- **Migration Required:** Consider standardizing on UUIDs for consistency

#### 2. Platform-Specific Campaign Tables
- **Issue:** `twitter_campaigns` exists but no general `campaigns` table
- **Impact:** Cannot create unified campaigns across platforms
- **Solution:** Create general `campaigns` table, migrate twitter_campaigns data

#### 3. Missing Foreign Key Relationships
- **Issue:** leads and content_posts lack campaign_id references
- **Impact:** Cannot properly associate content and leads with specific campaigns
- **Solution:** Add campaign_id columns and foreign keys

#### 4. Analytics Data Structure
- **Issue:** Analytics stored as unstructured JSONB in content_posts
- **Impact:** Cannot efficiently query or report on analytics data
- **Solution:** Create dedicated analytics table with proper indexing

## Migration Priority Matrix

### 🚨 CRITICAL (Must Fix Before Launch)
1. Create unified `campaigns` table
2. Add campaign_id to `leads` table
3. Add campaign_id to `content_posts` table
4. Create `analytics` table

### ⚠️ HIGH PRIORITY (Should Fix)
1. Standardize ID types (consider UUID migration)
2. Add proper foreign key constraints
3. Create database indexes for performance

### 📈 MEDIUM PRIORITY (Nice to Have)
1. Data migration scripts for existing twitter_campaigns
2. Analytics data migration from content_posts.platform_metrics
3. Schema documentation updates

## Recommended Migration Plan

### Phase 1: Core Table Creation
```sql
-- Create unified campaigns table
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  keywords text,
  topics text,
  platforms text[] DEFAULT '{}',
  content_json jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics table
CREATE TABLE analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id bigint REFERENCES content_posts(id),
  campaign_id uuid REFERENCES campaigns(id),
  platform text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);
```

### Phase 2: Schema Updates
```sql
-- Add campaign references
ALTER TABLE leads ADD COLUMN campaign_id uuid REFERENCES campaigns(id);
ALTER TABLE content_posts ADD COLUMN campaign_id uuid REFERENCES campaigns(id);

-- Create indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_content_posts_campaign_id ON content_posts(campaign_id);
```

### Phase 3: Data Migration
```sql
-- Migrate twitter_campaigns data to campaigns
INSERT INTO campaigns (id, user_id, name, keywords, status, created_at, updated_at)
SELECT uuid_generate_v4(), user_id, name, niche, status, created_at, updated_at
FROM twitter_campaigns;

-- Update foreign keys (would need actual migration logic)
-- This requires careful planning to maintain data integrity
```

## Testing Recommendations

1. **Unit Tests:** Schema validation, foreign key constraints
2. **Integration Tests:** Campaign creation → posting → analytics flow
3. **Data Migration Tests:** Verify data integrity after migrations
4. **Performance Tests:** Query performance with new indexes

## Risk Assessment

- **Data Loss Risk:** LOW - All migrations are additive
- **Downtime Risk:** MEDIUM - Requires careful migration planning
- **Complexity Risk:** HIGH - Multi-phase migration with data transformation

## Conclusion

The current schema provides a solid foundation with comprehensive account management and posting infrastructure. However, the **missing unified campaigns table** and **analytics tracking** are critical gaps that must be addressed before production launch. The migration plan is straightforward but requires careful execution to maintain data integrity.
