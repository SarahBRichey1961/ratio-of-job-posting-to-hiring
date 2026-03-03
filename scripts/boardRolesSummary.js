const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  try {
    // Get all boards
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id, name, industry')
      .order('industry')
      .order('name');

    const results = {
      byIndustry: {},
      withRoles: [],
      withoutRoles: []
    };

    console.log('Fetching roles for all boards...\n');

    for (const board of boards) {
      const { data: boardRoles } = await supabase
        .from('job_board_roles')
        .select('job_roles(name)')
        .eq('job_board_id', board.id);

      const roles = boardRoles.map(br => br.job_roles.name).sort();
      const industry = board.industry || 'Unknown';

      if (!results.byIndustry[industry]) {
        results.byIndustry[industry] = { total: 0, withRoles: 0, boards: [] };
      }

      results.byIndustry[industry].total++;

      if (roles.length > 0) {
        results.byIndustry[industry].withRoles++;
        results.withRoles.push({ name: board.name, roles: roles.join(', ') });
      } else {
        results.withoutRoles.push(board.name);
      }

      results.byIndustry[industry].boards.push({
        name: board.name,
        roleCount: roles.length,
        roles: roles
      });
    }

    // Print results by industry
    console.log('=== BOARDS BY INDUSTRY ===\n');
    for (const [industry, data] of Object.entries(results.byIndustry)) {
      console.log(`${industry}: ${data.withRoles}/${data.total} have roles`);
      for (const board of data.boards) {
        const status = board.roleCount > 0 ? '✅' : '❌';
        const roleStr = board.roleCount > 0 ? ` (${board.roles.join(', ')})` : '';
        console.log(`  ${status} ${board.name}${roleStr}`);
      }
      console.log();
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total Boards: ${boards.length}`);
    console.log(`With Roles: ${results.withRoles.length}`);
    console.log(`Without Roles: ${results.withoutRoles.length}`);
    console.log(`Coverage: ${((results.withRoles.length / boards.length) * 100).toFixed(1)}%`);

  } catch (err) {
    console.error('Error:', err.message);
  }
})();
