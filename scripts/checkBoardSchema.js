const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Get one board to see what columns exist
    const { data, error } = await supabase
      .from('job_boards')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('🔍 Job Board Columns:\n');
      console.log(Object.keys(data[0]));
      console.log('\n📊 Sample Board Data:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    // Also check the first few boards we created
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id, name, industry, score, lifespan, repost_rate, total_postings')
      .limit(5);

    if (boards) {
      console.log('\n📋 Sample of first 5 boards:\n');
      boards.forEach(b => {
        console.log(`${b.name.padEnd(20)} | Industry: ${b.industry.padEnd(25)} | Score: ${b.score} | Lifespan: ${b.lifespan} | Reposts: ${b.repost_rate}%`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
