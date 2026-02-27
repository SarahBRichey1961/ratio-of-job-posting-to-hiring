#!/usr/bin/env node

/**
 * Apply Hub Tables Migration to Supabase
 * This script directly executes the hub tables migration SQL
 * Run this once to set up the Hub feature tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable not set');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying Hub Tables Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'create_hub_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    if (!migrationSql.trim()) {
      console.error('❌ Migration file is empty');
      process.exit(1);
    }

    // Execute the migration via Supabase API
    // Note: We need to use the raw SQL query execution
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSql,
    }).catch(() => {
      // If exec_sql doesn't exist, we'll need to use a different approach
      return { error: 'RPC method not available' };
    });

    if (error && error.message.includes('not available')) {
      console.log('⚠️  Using Supabase SQL Editor approach...');
      console.log('\n📋 To apply the migration, please run this in the Supabase SQL Editor:');
      console.log('='.repeat(80));
      console.log(migrationSql);
      console.log('='.repeat(80));
      console.log('\nSteps:');
      console.log('1. Go to: https://supabase.com/dashboard');
      console.log('2. Select your project (eikhrkharihagaorqqcf)');
      console.log('3. Click "SQL Editor" in the left sidebar');
      console.log('4. Click "+ New Query"');
      console.log('5. Paste the SQL above');
      console.log('6. Click "Run"');
      process.exit(0);
    }

    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Hub Tables Migration Applied Successfully!');
    console.log('\nThe following tables have been created:');
    console.log('  - hub_members');
    console.log('  - hub_projects (with learning_goals and technologies_used columns)');
    console.log('  - hub_project_members');
    console.log('  - hub_discussions');
    console.log('  - hub_discussion_comments');
    console.log('  - hub_learning_resources');
    console.log('  - hub_user_achievements');
    console.log('  - hub_opportunities');
    console.log('  - hub_opportunity_applications');
    console.log('\n✨ You can now use the Hub feature!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run this SQL in the Supabase SQL Editor:');
    console.log('='.repeat(80));
    
    try {
      const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'create_hub_tables.sql');
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      console.log(migrationSql);
    } catch (readError) {
      console.error('Could not read migration file:', readError.message);
    }
    
    console.log('='.repeat(80));
    console.log('\nSteps:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the left sidebar');
    console.log('4. Click "+ New Query"');
    console.log('5. Paste the SQL above');
    console.log('6. Click "Run"');
    process.exit(1);
  }
}

applyMigration();
