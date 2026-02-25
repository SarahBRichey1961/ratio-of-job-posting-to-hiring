const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  console.log('🔍 CHECKING LINKEDIN & INDEED ROLES\n');

  // Get LinkedIn
  const { data: linkedinData } = await supabase
    .from('job_boards')
    .select('id, name, role_types')
    .ilike('name', '%linkedin%')
    .limit(1);

  console.log('LinkedIn Board:');
  if (linkedinData && linkedinData[0]) {
    console.log(`  Name: ${linkedinData[0].name}`);
    console.log(`  role_types: ${linkedinData[0].role_types}`);
    const linkedinId = linkedinData[0].id;

    // Get roles linked to LinkedIn
    const { data: linkedinRoles } = await supabase
      .from('job_board_roles')
      .select('job_role_id, job_roles(name)')
      .eq('job_board_id', linkedinId);

    console.log(`  Linked Roles (${linkedinRoles?.length || 0}):`);
    linkedinRoles?.forEach(lr => {
      if (lr.job_roles) {
        console.log(`    - ${lr.job_roles.name}`);
      }
    });
  }

  // Get Indeed
  const { data: indeedData } = await supabase
    .from('job_boards')
    .select('id, name, role_types')
    .ilike('name', '%indeed%')
    .limit(1);

  console.log('\nIndeed Board:');
  if (indeedData && indeedData[0]) {
    console.log(`  Name: ${indeedData[0].name}`);
    console.log(`  role_types: ${indeedData[0].role_types}`);
    const indeedId = indeedData[0].id;

    // Get roles linked to Indeed
    const { data: indeedRoles } = await supabase
      .from('job_board_roles')
      .select('job_role_id, job_roles(name)')
      .eq('job_board_id', indeedId);

    console.log(`  Linked Roles (${indeedRoles?.length || 0}):`);
    indeedRoles?.forEach(ir => {
      if (ir.job_roles) {
        console.log(`    - ${ir.job_roles.name}`);
      }
    });
  }

  // Check all boards with Product Manager role
  console.log('\n\n📊 ALL BOARDS WITH PRODUCT MANAGER ROLE:\n');
  const { data: productManagerBoards } = await supabase
    .from('job_board_roles')
    .select('job_boards(id, name, industry), job_roles(name)')
    .eq('job_roles.name', 'Product Manager');

  if (productManagerBoards && productManagerBoards.length > 0) {
    console.log(`Found ${productManagerBoards.length} boards with Product Manager:`);
    productManagerBoards.forEach(pb => {
      const board = pb.job_boards;
      console.log(`  - ${board.name} (${board.industry})`);
    });
  } else {
    console.log('❌ No boards linked to Product Manager role!');
  }
})();
