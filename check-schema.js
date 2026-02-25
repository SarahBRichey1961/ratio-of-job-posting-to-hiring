const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzQ2MjEsImV4cCI6MjA4NzA1MDYyMX0.YetoKqhF8-JUAo-Ynk3YakeasWamrR5wlGffwPjay8Q';

const supabase = createClient(supabaseUrl, anonKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');
  
  // Try to query the health/status
  try {
    const { data, error } = await supabase
      .from('job_boards')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing job_boards table:');
      console.log(`   ${error.message}\n`);
      
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        console.log('🔴 The job_boards table does NOT exist in your database!\n');
        console.log('📋 Please do the following:\n');
        console.log('1. Go to: https://app.supabase.com');
        console.log('2. Select project: blhrazwlfzrclwaluqak');
        console.log('3. Click: SQL Editor → "+ New Query"');
        console.log('4. Paste the ENTIRE content from:');
        console.log('   supabase/migrations/001_initial_schema.sql\n');
        console.log('5. Click the blue RUN button ▶️');
        console.log('6. Wait for it to complete (should see 9 statements executed)\n');
        console.log('Then run this script again.');
      }
      return false;
    } else {
      console.log('✅ Database schema exists!');
      console.log(`   Current job boards count: ${data}\n`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Fatal error: ${err.message}`);
    return false;
  }
}

checkSchema();
