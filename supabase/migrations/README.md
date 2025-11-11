# Database Migrations for PostPulse.io

This folder contains SQL migrations to align the database schema with PostPulse.io PRD requirements.

## Migration Order

Run migrations in this exact order:

1. `20251110120000_create_campaigns_and_analytics_tables.sql`
2. `20251110120100_add_campaign_references.sql`
3. `20251110120200_migrate_twitter_campaigns_data.sql`
4. `20251110120300_add_account_integration_fields.sql`

## How to Run Migrations

### In Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Run them in order (one at a time)
5. Verify each migration completes successfully

### Safety Precautions

**Before running any migrations:**
- ✅ Create a database backup
- ✅ Test migrations on a staging environment first
- ✅ Verify you have admin access to the database
- ✅ Check that all foreign key relationships are valid

**Monitor during migration:**
- Check Supabase logs for errors
- Verify row counts remain consistent
- Test RLS policies after migration

## Migration Details

### 1. Create Campaigns and Analytics Tables
- Creates unified `campaigns` table for multi-platform support
- Creates `analytics` table for structured metrics tracking
- Adds comprehensive RLS policies
- Creates helper functions and views

### 2. Add Campaign References
- Adds `campaign_id` foreign keys to `leads` and `content_posts` tables
- Updates RLS policies to support campaign-based access
- Creates indexes for performance

### 3. Migrate Twitter Campaigns Data
- Migrates existing `twitter_campaigns` data to new `campaigns` table
- Updates foreign key references in related tables
- Creates backup views for rollback safety

### 4. Add Account Integration Fields
- Adds Upload-Post profile key and connection status to `social_accounts`
- Adds MoreLogin cloud phone ID reference
- Adds account verification, warmup tracking, and enhanced profile fields
- Creates indexes for performance and optional foreign key constraints

## Rollback Procedure

If migrations fail or cause issues:

1. Run `rollback_migrations.sql` in Supabase SQL Editor
2. Verify database returns to pre-migration state
3. Restore from backup if rollback fails

## Testing After Migration

After successful migration, test:

1. **Campaign Creation**: Can create campaigns for multiple platforms
2. **Data Relationships**: Leads and posts properly link to campaigns
3. **Analytics**: Can insert and query analytics data
4. **RLS Policies**: Users can only access their own data
5. **Existing Data**: Twitter campaigns still accessible via backup views
6. **Account Integration**: Can set Upload-Post profile keys and cloud phone IDs
7. **Verification Status**: Account verification and warmup tracking works

## Schema Changes Summary

| Table | Changes |
|-------|---------|
| `campaigns` | ✅ **NEW** - Unified multi-platform campaigns |
| `analytics` | ✅ **NEW** - Structured metrics tracking |
| `leads` | ➕ Added `campaign_id` FK |
| `content_posts` | ➕ Added `campaign_id` FK |
| `profiles` | ✅ Already compliant |
| `social_accounts` | ➕ Added integration fields (Upload-Post, MoreLogin) |
| `posting_queue` | ✅ Already compliant |

## Expected Impact

- **Data Integrity**: Improved with proper foreign key relationships
- **Query Performance**: Enhanced with new indexes
- **Security**: Strengthened with campaign-based RLS policies
- **Functionality**: Enables multi-platform campaign management
- **Analytics**: Structured tracking of impressions, clicks, conversions

## Support

If migration issues occur:
1. Check Supabase logs for specific error messages
2. Verify all prerequisites are met
3. Use rollback script if needed
4. Contact development team with error details
