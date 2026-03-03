const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

(async () => {
  try {
    console.log('📋 COMPREHENSIVE ROLE POPULATION\n');

    // Get all boards
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id, name, industry, category');

    // Get all roles for reference
    const { data: roles } = await supabase
      .from('job_roles')
      .select('id, name');

    console.log(`Found ${boards.length} boards and ${roles.length} roles\n`);

    // Define role assignments by industry/category type
    const rolesByIndustry = {
      'Technology': ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Designer'],
      'Finance': ['Data Scientist', 'Product Manager', 'Operations', 'Sales', 'Marketing', 'Accountant'],
      'Law': ['Lawyer', 'Operations', 'Product Manager', 'Marketing', 'Sales'],
      'Manufacturing': ['Operations', 'Product Manager', 'Sales', 'Designer', 'Manufacturer'],
      'Construction': ['Construction Worker', 'Operations', 'Product Manager', 'Sales'],
      'Healthcare': ['Healthcare', 'Operations', 'Product Manager', 'Sales', 'Marketing'],
      'Education': ['Teacher', 'Product Manager', 'Operations', 'Marketing', 'Sales'],
      'Government': ['Operations', 'Product Manager', 'Designer', 'Sales', 'Marketing'],
      'General': ['Product Manager', 'Operations', 'Sales', 'Marketing', 'Designer', 'Data Scientist'],
      'Remote': ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Designer', 'Data Scientist', 'Product Manager'],
      'Creative': ['Designer', 'Frontend Developer', 'Marketing', 'Product Manager', 'Sales'],
    };

    let insertedCount = 0;
    let skippedCount = 0;

    for (const board of boards) {
      // Determine roles based on industry
      const industry = board.industry || 'General';
      let assignedRoles = rolesByIndustry[industry] || rolesByIndustry['General'];

      // Get existing roles for this board
      const { data: existingRoles } = await supabase
        .from('job_board_roles')
        .select('job_role_id')
        .eq('job_board_id', board.id);

      const existingRoleIds = existingRoles.map(r => r.job_role_id);

      // Assign roles that don't already exist
      for (const roleName of assignedRoles) {
        const role = roles.find(r => r.name === roleName);
        if (!role) continue;

        // Skip if already assigned
        if (existingRoleIds.includes(role.id)) {
          skippedCount++;
          continue;
        }

        const { error } = await supabase
          .from('job_board_roles')
          .insert({
            job_board_id: board.id,
            job_role_id: role.id
          });

        if (!error) {
          insertedCount++;
          console.log(`✅ Added "${roleName}" to "${board.name}"`);
        }
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  ✅ Inserted: ${insertedCount} new mappings`);
    console.log(`  ⏭️  Skipped: ${skippedCount} (already assigned)`);

  } catch (err) {
    console.error('Fatal error:', err.message);
  }
})();
