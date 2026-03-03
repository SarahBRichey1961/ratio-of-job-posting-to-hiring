const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

// Define comprehensive role mappings by industry
const rolesByIndustry = {
  'Technology': [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 
    'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Designer',
    'Software Engineer', 'Systems Engineer', 'Cloud Engineer'
  ],
  'Finance & Accounting': [
    'Data Scientist', 'Product Manager', 'Accountant', 'Operations', 
    'Sales', 'Marketing', 'Designer', 'Backend Developer'
  ],
  'General': [
    'Product Manager', 'Sales', 'Marketing', 'Operations', 
    'Designer', 'Data Scientist'
  ],
  'Government': [
    'Product Manager', 'Operations', 'Sales', 'Marketing', 'Designer'
  ],
  'Legal': [
    'Lawyer', 'Product Manager', 'Operations', 'Sales', 'Marketing', 'Designer'
  ],
  'Manufacturing': [
    'Operations', 'Product Manager', 'Designer', 'Sales', 'Manufacturer'
  ],
  'Construction': [
    'Construction Worker', 'Operations', 'Product Manager', 'Sales'
  ],
  'Creative & Media': [
    'Designer', 'Frontend Developer', 'Marketing', 'Product Manager', 'Sales'
  ],
  'Education': [
    'Teacher', 'Product Manager', 'Operations', 'Marketing', 'Designer'
  ],
  'Remote': [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 
    'Designer', 'Data Scientist', 'Product Manager'
  ],
  'Retail & Hospitality': [
    'Sales', 'Operations', 'Marketing', 'Product Manager', 'Retail'
  ],
  'Science & Biotech': [
    'Scientist', 'Data Scientist', 'Product Manager', 'Operations', 'Designer'
  ],
  'Transportation & Logistics': [
    'Truck Driver', 'Operations', 'Product Manager', 'Sales', 'Marketing'
  ]
};

(async () => {
  try {
    console.log('📋 POPULATING ALL REMAINING BOARDS WITH ROLES\n');

    // Get all boards
    const { data: boards } = await supabase
      .from('job_boards')
      .select('id, name, industry')
      .order('industry')
      .order('name');

    // Get all roles
    const { data: roles } = await supabase
      .from('job_roles')
      .select('id, name');

    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.name] = r.id;
    });

    let totalInserted = 0;
    let boardsUpdated = 0;
    const boardsByIndustry = {};

    for (const board of boards) {
      const industry = board.industry || 'General';
      
      // Skip boards that already have roles
      const { data: existingRoles } = await supabase
        .from('job_board_roles')
        .select('id')
        .eq('job_board_id', board.id);

      if (existingRoles && existingRoles.length > 0) {
        continue;
      }

      // Get roles for this industry
      const rolesForIndustry = rolesByIndustry[industry] || rolesByIndustry['General'];
      
      if (!boardsByIndustry[industry]) {
        boardsByIndustry[industry] = { count: 0, boards: [] };
      }
      boardsByIndustry[industry].count++;
      boardsByIndustry[industry].boards.push(board.name);

      // Insert role assignments
      for (const roleName of rolesForIndustry) {
        const roleId = roleMap[roleName];
        if (!roleId) {
          console.log(`⚠️  Role "${roleName}" not found in database`);
          continue;
        }

        const { error } = await supabase
          .from('job_board_roles')
          .insert({
            job_board_id: board.id,
            job_role_id: roleId
          });

        if (!error) {
          totalInserted++;
        }
      }

      boardsUpdated++;
      console.log(`✅ Updated "${board.name}" with ${rolesForIndustry.length} roles`);
    }

    console.log(`\n✅ COMPLETED!`);
    console.log(`  Boards Updated: ${boardsUpdated}`);
    console.log(`  Roles Inserted: ${totalInserted}`);
    
    console.log(`\n📊 By Industry:`);
    for (const [industry, data] of Object.entries(boardsByIndustry)) {
      console.log(`  ${industry}: ${data.count} boards`);
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
  }
})();
