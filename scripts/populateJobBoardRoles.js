const { createClient } = require('@supabase/supabase-js');

// Using the correct Supabase project from .env.local
const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  try {
    console.log('📋 POPULATING job_board_roles TABLE\n');

    // Get all boards
    const { data: boards, error: boardError } = await supabase
      .from('job_boards')
      .select('id, name');

    if (boardError) {
      console.error('❌ Error fetching boards:', boardError);
      return;
    }

    // Get all roles
    const { data: roles, error: roleError } = await supabase
      .from('job_roles')
      .select('id, name');

    if (roleError) {
      console.error('❌ Error fetching roles:', roleError);
      return;
    }

    console.log(`Found ${boards.length} boards and ${roles.length} roles\n`);

    // Define board-specific role mappings
    const boardRoleMappings = {
      'USAJobs': ['Product Manager', 'Operations', 'Sales', 'Marketing'],
      'GovernmentJobs.com': ['Operations', 'Marketing', 'Designer'],
      'Careers in Government': ['Product Manager', 'Operations', 'Designer'],
      'eFinancialCareers': ['Frontend Developer', 'Backend Developer', 'Data Scientist', 'Product Manager'],
      'AccountingJobsToday': ['Frontend Developer', 'Backend Developer', 'Designer'],
    };

    let insertedCount = 0;

    // Insert mappings
    for (const board of boards) {
      const boardRoles = boardRoleMappings[board.name] || roles.map(r => r.name);
      
      for (const roleName of boardRoles) {
        const role = roles.find(r => r.name === roleName);
        if (!role) {
          console.log(`⚠️  Role "${roleName}" not found for board "${board.name}"`);
          continue;
        }

        const { data, error } = await supabase
          .from('job_board_roles')
          .insert({
            job_board_id: board.id,
            job_role_id: role.id
          });

        if (error) {
          // Check if it's a unique constraint violation (already exists)
          if (error.message.includes('duplicate') || error.message.includes('violate')) {
            // Already exists, skip
          } else {
            console.error(`❌ Error inserting role for ${board.name}:`, error.message);
          }
        } else {
          insertedCount++;
          console.log(`✅ Added "${roleName}" to "${board.name}"`);
        }
      }
    }

    console.log(`\n✅ Inserted ${insertedCount} board-role mappings!`);

    // Verify the data
    const { data: verification } = await supabase
      .from('job_board_roles')
      .select('job_board_id, job_role_id, job_roles(name)');

    console.log(`\n📊 Verification: job_board_roles now has ${verification.length} total records`);

  } catch (err) {
    console.error('Fatal error:', err);
  }
})();
