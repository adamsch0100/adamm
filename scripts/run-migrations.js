#!/usr/bin/env node

/**
 * PostPulse.io Database Migration Runner
 * Runs all critical migrations in the correct order
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrations = [
  {
    name: 'Create Campaigns and Analytics Tables',
    file: 'supabase/migrations/20251110120000_create_campaigns_and_analytics_tables.sql'
  },
  {
    name: 'Add Campaign References',
    file: 'supabase/migrations/20251110120100_add_campaign_references.sql'
  },
  {
    name: 'Migrate Twitter Campaigns Data',
    file: 'supabase/migrations/20251110120200_migrate_twitter_campaigns_data.sql'
  }
];

async function runMigrations() {
  console.log('🚀 Starting PostPulse.io Database Migrations...\n');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY exists:', !!SUPABASE_SERVICE_KEY);

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`📋 Step ${i + 1}/${migrations.length}: ${migration.name}`);
    console.log(`   File: ${migration.file}`);

    try {
      // Read migration file
      const sqlContent = readFileSync(migration.file, 'utf8');

      // Split into individual statements (basic approach)
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      console.log(`   📄 Found ${statements.length} SQL statements`);

          // Execute the entire migration as one statement
          console.log(`   ⚡ Executing migration...`);
          const { error } = await supabase.rpc('exec_sql', {
            sql: sqlContent
          });

          if (error) {
            console.log(`   ❌ Error executing migration:`, error.message);
            console.log('\n🔧 Manual execution required:');
            console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
            console.log(`   2. Copy and paste the contents of: ${migration.file}`);
            console.log(`   3. Run the SQL commands`);
            console.log(`   4. Re-run this script to continue\n`);

            process.exit(1);
          } else {
            console.log(`   ✅ Migration executed successfully`);
          }

      console.log(`   ✅ ${migration.name} completed\n`);

    } catch (error) {
      console.error(`   ❌ ${migration.name} failed:`, error.message);
      console.log('\n🔧 Manual execution required:');
      console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
      console.log(`   2. Copy and paste the contents of: ${migration.file}`);
      console.log(`   3. Run the SQL commands`);
      console.log(`   4. Re-run this script to continue\n`);

      process.exit(1);
    }
  }

  console.log('🎉 All migrations completed successfully!');
  console.log('\n🔍 Verifying migrations...');

  // Verify migrations worked
  try {
    const { data: campaignsTable } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'campaigns')
      .single();

    const { data: analyticsTable } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'analytics')
      .single();

    if (campaignsTable && analyticsTable) {
      console.log('✅ Verification passed: campaigns and analytics tables exist');
    } else {
      console.log('⚠️  Verification incomplete: tables may not be fully created');
    }

    // Check RLS
    const { data: rlsCheck } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['campaigns', 'analytics']);

    const rlsEnabled = rlsCheck?.every(table => table.rowsecurity) || false;
    if (rlsEnabled) {
      console.log('✅ RLS enabled on new tables');
    } else {
      console.log('⚠️  RLS may not be properly configured');
    }

  } catch (error) {
    console.log('⚠️  Could not verify migrations:', error.message);
  }

  console.log('\n🎯 Next steps:');
  console.log('1. Run Railway deployment (see DEPLOYMENT-QUICKSTART.md)');
  console.log('2. Test the application at your Railway URL');
  console.log('3. Configure remaining API keys in Supabase operator_settings');
  console.log('4. Start creating campaigns and generating revenue!');

  console.log('\n💰 Let\'s make some money! 🚀');
}

// Handle command line execution
console.log('Script loaded, running migrations...');
runMigrations().catch(error => {
  console.error('Migration runner failed:', error);
  process.exit(1);
});

export { runMigrations };
