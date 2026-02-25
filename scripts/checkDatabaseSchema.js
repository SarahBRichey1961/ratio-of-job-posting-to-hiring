const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 CHECKING DATABASE SCHEMA\n');

    // List all tables
    const { data, error } = await supabase.rpc('get_tables', {});
    
    if (error && !error.message.includes('does not exist')) {
      console.log('Using direct table queries instead...\n');
    }

    // Check what tables exist by trying to query them
    const tables = ['job_postings', 'job_boards', 'employer_survey_stats_by_board', 'candidate_survey_stats_by_board', 'efficiency_scores'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table}: Does not exist`);
      } else if (error && error.code === '42703') {
        console.log(`⚠️  ${table}: Columns issue - ${error.message}`);
      } else if (error) {
        console.log(`❓ ${table}: ${error.message}`);
      } else if (data) {
        console.log(`✅ ${table}`);
        if (data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    }

    // Get one record from job_postings to see full structure
    console.log('\n📋 Sample job_posting record:');
    const { data: sample } = await supabase
      .from('job_postings')
      .select('*')
      .limit(1);

    if (sample && sample.length > 0) {
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
