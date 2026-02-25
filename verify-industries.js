const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  const { data, error } = await supabase
    .from('job_boards')
    .select('name, industry')
    .limit(5);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Sample data:');
    data.forEach(row => console.log(`  ${row.name}: ${row.industry}`));
  }
  
  const { data: allData } = await supabase
    .from('job_boards')
    .select('industry');
  
  const unique = [...new Set(allData.map(r => r.industry))].sort();
  console.log(`\nAll industries (${unique.length}):`);
  unique.forEach(ind => console.log(`  - ${ind}`));
  
  process.exit(0);
})();
