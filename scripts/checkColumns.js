const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  // Check job_postings columns
  const { data: postings } = await supabase.from('job_postings').select('*').limit(1);
  console.log('job_postings columns:');
  if (postings && postings.length > 0) {
    console.log(Object.keys(postings[0]).join(', '));
  }

  // Check efficiency_scores columns
  const { data: scores } = await supabase.from('efficiency_scores').select('*').limit(1);
  console.log('\nefficiency_scores columns:');
  if (scores && scores.length > 0) {
    console.log(Object.keys(scores[0]).join(', '));
  }
})();
