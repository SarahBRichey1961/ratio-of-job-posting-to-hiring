import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let value = match[2].trim();
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1].trim()] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read migration file
const sqlPath = path.join(__dirname, 'CREATE_APP_SUBMISSIONS_TABLE.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('📦 Running migration: CREATE_APP_SUBMISSIONS_TABLE.sql');
console.log('🔗 Connecting to Supabase:', supabaseUrl);

// Create admin client
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Execute SQL directly
try {
  console.log('▶️  Executing SQL migration...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('⚠️  RPC method error:', error.message);
    throw error;
  }

  console.log('✅ Migration executed successfully!');
  console.log('\n📊 Database changes applied:');
  console.log('  ✓ Created table: app_submissions');
  console.log('  ✓ Created indexes for search optimization');
  console.log('  ✓ Enabled Row Level Security (RLS)');
  console.log('  ✓ Set public read/insert policies');
  console.log('  ✓ Granted anon & authenticated permissions');
  
  process.exit(0);
} catch (err) {
  console.error('❌ Error executing migration:', err.message);
  
  console.log('\n📋 Manual execution instructions:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project (ratio-of-job-posting-to-hiring)');
  console.log('3. Click "SQL Editor" in the left menu');
  console.log('4. Click "New Query"');
  console.log('5. Copy the entire contents of CREATE_APP_SUBMISSIONS_TABLE.sql');
  console.log('6. Paste into the SQL editor');
  console.log('7. Click "Run" button (or Ctrl+Enter)');
  console.log('8. Wait for ✅ "Success" message\n');
  
  process.exit(1);
}
