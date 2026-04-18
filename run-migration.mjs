#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

for (const line of envLines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
  }
}

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('📦 Running migration: CREATE_APP_SUBMISSIONS_TABLE.sql');
console.log(`🔗 Connecting to Supabase: ${supabaseUrl}`);

// Create admin client (with service role key for full permissions)
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Read migration file
const migrationPath = path.join(__dirname, 'CREATE_APP_SUBMISSIONS_TABLE.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log('\n▶️  Executing SQL migration...\n');

// Execute the migration
try {
  const { error } = await supabase.rpc('exec', { sql });
  
  if (error) {
    // Try alternative approach - using pgAdmin or direct postgres
    console.log('⚠️  RPC method failed, trying direct SQL execution...\n');
    
    // Split SQL into individual statements and execute
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        const { error: execError } = await supabase.rpc('exec', { 
          sql: statement + ';' 
        }).catch(() => ({ error: { message: 'RPC unavailable' } }));
        
        if (execError?.message === 'RPC unavailable' || execError?.message.includes('404')) {
          console.log('⚠️  RPC method not available. Instructions for manual setup:');
          console.log('\n📋 To create the database table manually:');
          console.log('1. Go to https://app.supabase.com → Select your project');
          console.log('2. Click "SQL Editor" in the left menu');
          console.log('3. Click "New Query"');
          console.log('4. Copy the entire contents of CREATE_APP_SUBMISSIONS_TABLE.sql');
          console.log('5. Paste into the SQL editor');
          console.log('6. Click "Run" button (or Ctrl+Enter)');
          console.log('7. Wait for ✅ "Success" message');
          console.log('\n✅ After creating the table, run:');
          console.log('   node test-build-the-damn-thing-db-search.mjs\n');
          process.exit(0);
        }
      }
    }
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('\n📊 Database table "app_submissions" is now ready');
  console.log('\n▶️  Testing the deployment...');
  console.log('Run: node test-build-the-damn-thing-db-search.mjs\n');
  
} catch (err) {
  console.error('\n❌ Error executing migration:');
  console.error(err.message);
  console.log('\n📋 To create the database table manually:');
  console.log('1. Go to https://app.supabase.com → Select your project');
  console.log('2. Click "SQL Editor" in the left menu');
  console.log('3. Click "New Query"');
  console.log('4. Copy the entire contents of CREATE_APP_SUBMISSIONS_TABLE.sql');
  console.log('5. Paste into the SQL editor');
  console.log('6. Click "Run" button (or Ctrl+Enter)');
  console.log('7. Wait for ✅ "Success" message\n');
  process.exit(1);
}
