const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzQ2MjEsImV4cCI6MjA4NzA1MDYyMX0.QdpMtPMZk6sVXVKqJxRR_PHqV4tGx7TTCQhp0_KQ_M0';

const supabaseAnon = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  anonKey
);

(async () => {
  console.log('🔍 COMPARING SERVICE ROLE vs ANON KEY\n');

  // Test with service role
  console.log('=== WITH SERVICE ROLE KEY ===\n');
  const { data: serviceData, error: serviceError } = await supabase
    .from('job_board_roles')
    .select('job_board_id, job_role_id, job_roles(name)')
    .limit(5);

  if (serviceError) {
    console.log('❌ Error:', serviceError);
  } else {
    console.log(`✅ Success: Retrieved ${serviceData.length} records`);
    console.log('Sample record:', JSON.stringify(serviceData[0], null, 2));
  }

  console.log('\n=== WITH ANON KEY ===\n');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('job_board_roles')
    .select('job_board_id, job_role_id, job_roles(name)')
    .limit(5);

  if (anonError) {
    console.log('❌ Error:', anonError);
  } else {
    console.log(`✅ Success: Retrieved ${anonData.length} records`);
    console.log('Sample record:', JSON.stringify(anonData[0], null, 2));
  }

  // Test without the relationship
  console.log('\n=== TEST WITHOUT RELATIONSHIP (just job_board_id) ===\n');
  const { data: simpleData, error: simpleError } = await supabaseAnon
    .from('job_board_roles')
    .select('job_board_id')
    .limit(5);

  if (simpleError) {
    console.log('❌ Error:', simpleError);
  } else {
    console.log(`✅ Success: Retrieved ${simpleData.length} records`);
  }
})();
