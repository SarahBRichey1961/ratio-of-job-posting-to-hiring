const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  try {
    // Get all boards with their roles count
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id, name, industry, category')
      .order('industry')
      .order('name');

    const boardsWithRoles = [];
    const boardsWithoutRoles = [];

    for (const board of boards) {
      const { data: boardRoles } = await supabase
        .from('job_board_roles')
        .select('job_roles(name)')
        .eq('job_board_id', board.id);

      const roles = boardRoles.map(br => br.job_roles.name).sort();
      
      if (roles.length > 0) {
        boardsWithRoles.push({
          id: board.id,
          name: board.name,
          industry: board.industry || 'N/A',
          roleCount: roles.length,
          roles: roles.join('; ')
        });
      } else {
        boardsWithoutRoles.push({
          id: board.id,
          name: board.name,
          industry: board.industry || 'N/A',
          roleCount: 0,
          roles: 'N/A'
        });
      }
    }

    // Write CSV format
    console.log('ID,Name,Industry,RoleCount,Roles');
    
    // Boards with roles first
    for (const b of boardsWithRoles) {
      const rolesStr = `"${b.roles}"`;
      console.log(`${b.id},"${b.name}","${b.industry}",${b.roleCount},${rolesStr}`);
    }
    
    // Then boards without roles
    for (const b of boardsWithoutRoles) {
      console.log(`${b.id},"${b.name}","${b.industry}",${b.roleCount},"${b.roles}"`);
    }

    console.error('\n\n📊 SUMMARY:');
    console.error(`Total Boards: ${boards.length}`);
    console.error(`Boards with Roles: ${boardsWithRoles.length}`);
    console.error(`Boards without Roles: ${boardsWithoutRoles.length}`);
    console.error(`Coverage: ${((boardsWithRoles.length / boards.length) * 100).toFixed(1)}%`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  }
})();
