const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  try {
    console.log('📋 COMPLETE LIST OF ALL 70 JOB BOARDS AND THEIR ROLES\n');

    // Get all boards
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name, industry, category')
      .order('industry')
      .order('name');

    if (boardError) {
      console.error('Error fetching boards:', boardError);
      return;
    }

    console.log(`Total Boards: ${boards.length}\n`);
    console.log('=' .repeat(80) + '\n');

    let boardsWithRoles = 0;
    let boardsWithoutRoles = 0;

    for (const board of boards) {
      const { data: boardRoles } = await supabase
        .from('job_board_roles')
        .select('job_roles(name)')
        .eq('job_board_id', board.id);

      const roles = boardRoles.map(br => br.job_roles.name).sort();
      
      if (roles.length > 0) {
        boardsWithRoles++;
        console.log(`${board.id}. ${board.name}`);
        console.log(`   Industry: ${board.industry || 'N/A'}`);
        console.log(`   Roles (${roles.length}): ${roles.join(', ')}\n`);
      } else {
        boardsWithoutRoles++;
        console.log(`${board.id}. ${board.name}`);
        console.log(`   Industry: ${board.industry || 'N/A'}`);
        console.log(`   Roles: ❌ N/A\n`);
      }
    }

    console.log('=' .repeat(80));
    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✅ Boards with roles: ${boardsWithRoles}`);
    console.log(`  ❌ Boards without roles: ${boardsWithoutRoles}`);
    console.log(`  📈 Total: ${boards.length}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  }
})();
