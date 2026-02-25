const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  console.log('🔍 TESTING THE EXACT QUERY FROM COMPARISON PAGE\n');

  // Simulate the exact query from getServerSideProps
  const { data: boardRolesData } = await supabase
    .from('job_board_roles')
    .select('job_board_id, job_role_id, job_roles(name)');

  console.log(`Total job_board_roles returned: ${boardRolesData?.length || 0}\n`);

  // Build the same board roles map as the comparison page
  const boardRolesMap = {};
  (boardRolesData || []).forEach((br) => {
    const boardId = br.job_board_id;
    const roleName = br.job_roles?.name;
    if (roleName) {
      if (!boardRolesMap[boardId]) {
        boardRolesMap[boardId] = [];
      }
      if (!boardRolesMap[boardId].includes(roleName)) {
        boardRolesMap[boardId].push(roleName);
      }
    }
  });

  // Now get LinkedIn and Indeed boards
  const { data: boards } = await supabase
    .from('job_boards')
    .select('id, name')
    .in('name', ['LinkedIn', 'Indeed']);

  console.log('LinkedIn and Indeed board roles:\n');
  
  boards.forEach(board => {
    const roles = boardRolesMap[board.id] || [];
    console.log(`${board.name} (ID: ${board.id}):`);
    console.log(`  Roles: ${roles.join(', ')}`);
    console.log(`  Has Product Manager: ${roles.includes('Product Manager') ? '✅ YES' : '❌ NO'}\n`);
  });

  // Also test filtering manually
  console.log('\n📋 TESTING FILTER:\n');
  
  const selectedRole = 'Product Manager';
  const selectedIndustry = 'All Industries';
  
  const testBoards = [
    { id: 223, name: 'LinkedIn', industry: 'General' },
    { id: 224, name: 'Indeed', industry: 'General' }
  ];

  console.log(`Filtering for: Role="${selectedRole}", Industry="${selectedIndustry}"\n`);

  testBoards.forEach(board => {
    const roles = boardRolesMap[board.id] || [];
    const roleMatch = selectedRole === 'All Roles' || roles.includes(selectedRole);
    const industryMatch = selectedIndustry === 'All Industries' || board.industry === selectedIndustry;
    const passes = roleMatch && industryMatch;
    
    console.log(`${board.name}:`);
    console.log(`  Roles: ${roles.join(', ')}`);
    console.log(`  Role Match: ${roleMatch}`);
    console.log(`  Industry Match: ${industryMatch}`);
    console.log(`  PASSES FILTER: ${passes ? '✅ YES' : '❌ NO'}\n`);
  });
})();
