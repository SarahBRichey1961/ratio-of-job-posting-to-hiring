const { createClient } = require('@supabase/supabase-js');

// Using the correct Supabase project from .env.local
const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  console.log('🔍 CHECKING CORRECT SUPABASE PROJECT\n');

  // Check job_board_roles data
  console.log('=== job_board_roles ===\n');
  const { data: boardRolesData, error: brError } = await supabase
    .from('job_board_roles')
    .select('job_board_id, job_role_id, job_roles(name)')
    .limit(10);

  if (brError) {
    console.log('❌ Error:', brError.message);
  } else {
    console.log(`✅ Found ${boardRolesData.length} records`);
    if (boardRolesData.length > 0) {
      console.log('Sample:', JSON.stringify(boardRolesData[0], null, 2));
    }
  }

  // Check job_boards
  console.log('\n=== job_boards ===\n');
  const { data: boardsData, error: bError } = await supabase
    .from('job_boards')
    .select('id, name, industry')
    .limit(5);

  if (bError) {
    console.log('❌ Error:', bError.message);
  } else {
    console.log(`✅ Found ${boardsData.length} boards`);
    boardsData.forEach(b => {
      console.log(`  - ${b.name} (ID: ${b.id})`);
    });
  }

  // Check job_roles
  console.log('\n=== job_roles ===\n');
  const { data: rolesData, error: rError } = await supabase
    .from('job_roles')
    .select('id, name')
    .limit(10);

  if (rError) {
    console.log('❌ Error:', rError.message);
  } else {
    console.log(`✅ Found ${rolesData.length} roles`);
    rolesData.forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
})();
