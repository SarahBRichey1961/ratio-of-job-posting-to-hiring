const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  console.log('✅ FINAL VERIFICATION\n');

  // Count total job_board_roles
  const { data: allRoles, count } = await supabase
    .from('job_board_roles')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`📊 Total job_board_roles records: ${count}`);

  // Show sample boards with their roles
  const { data: boards } = await supabase
    .from('job_boards')
    .select('id, name')
    .limit(10);

  console.log('\n📋 Sample boards with their roles:\n');

  for (const board of boards) {
    const { data: boardRoles } = await supabase
      .from('job_board_roles')
      .select('job_roles(name)')
      .eq('job_board_id', board.id);
    
    const roles = boardRoles.map(br => br.job_roles.name);
    console.log(`${board.name}:`);
    console.log(`  Roles: ${roles.length > 0 ? roles.join(', ') : 'N/A'}\n`);
  }

  console.log('✅ The comparison page should now show roles instead of N/A!');
})();
