const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  console.log('🔍 CHECKING FOR DUPLICATE ROLE LINKS\n');

  // Get LinkedIn ID
  const { data: linkedinData } = await supabase
    .from('job_boards')
    .select('id')
    .eq('name', 'LinkedIn')
    .single();

  if (linkedinData) {
    const linkedinId = linkedinData.id;
    console.log(`LinkedIn ID: ${linkedinId}\n`);

    // Check all role links for LinkedIn
    const { data: linkedinLinks } = await supabase
      .from('job_board_roles')
      .select('id, job_board_id, job_role_id, job_roles(name)')
      .eq('job_board_id', linkedinId);

    console.log(`LinkedIn has ${linkedinLinks?.length || 0} role links:`);
    linkedinLinks?.forEach((link, i) => {
      console.log(`  ${i + 1}. Role ID: ${link.job_role_id}, Role: ${link.job_roles.name}`);
    });

    // Check for duplicates
    if (linkedinLinks && linkedinLinks.length > 0) {
      const roleIds = linkedinLinks.map(l => l.job_role_id);
      const uniqueRoleIds = new Set(roleIds);
      if (roleIds.length !== uniqueRoleIds.size) {
        console.log(`\n⚠️  DUPLICATES FOUND! ${roleIds.length} links, ${uniqueRoleIds.size} unique roles`);
        
        // Find which roles are duplicated
        const roleCounts = {};
        roleIds.forEach(rid => {
          roleCounts[rid] = (roleCounts[rid] || 0) + 1;
        });
        
        console.log('\nDuplicated roles:');
        Object.entries(roleCounts).forEach(([rid, count]) => {
          if (count > 1) {
            const role = linkedinLinks.find(l => l.job_role_id === parseInt(rid));
            console.log(`  - ${role.job_roles.name}: ${count} times`);
          }
        });
      }
    }
  }

  // Also check Indeed
  const { data: indeedData } = await supabase
    .from('job_boards')
    .select('id')
    .eq('name', 'Indeed')
    .single();

  if (indeedData) {
    const indeedId = indeedData.id;
    console.log(`\nIndeed ID: ${indeedId}\n`);

    const { data: indeedLinks } = await supabase
      .from('job_board_roles')
      .select('id, job_board_id, job_role_id, job_roles(name)')
      .eq('job_board_id', indeedId);

    console.log(`Indeed has ${indeedLinks?.length || 0} role links:`);
    indeedLinks?.forEach((link, i) => {
      console.log(`  ${i + 1}. Role ID: ${link.job_role_id}, Role: ${link.job_roles.name}`);
    });

    if (indeedLinks && indeedLinks.length > 0) {
      const roleIds = indeedLinks.map(l => l.job_role_id);
      const uniqueRoleIds = new Set(roleIds);
      if (roleIds.length !== uniqueRoleIds.size) {
        console.log(`\n⚠️  DUPLICATES FOUND! ${roleIds.length} links, ${uniqueRoleIds.size} unique roles`);
      }
    }
  }
})();
