const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  try {
    console.log('🔍 SIMULATING FULL getServerSideProps FLOW\n');

    // Step 1: Fetch boards
    const { data: boardsData, error: boardsError } = await supabase
      .from('job_boards')
      .select('id, name, url, category, industry, description')
      .order('industry')
      .order('name');

    if (boardsError) {
      console.error('Board fetch error:', boardsError);
      process.exit(1);
    }

    console.log(`✅ Fetched ${boardsData?.length} boards`);

    // Step 2: Fetch board roles
    const { data: boardRolesData, error: boardRolesError } = await supabase
      .from('job_board_roles')
      .select('job_board_id, job_role_id, job_roles(name)');

    if (boardRolesError) {
      console.error('Board roles fetch error:', boardRolesError);
      process.exit(1);
    }

    console.log(`✅ Fetched ${boardRolesData?.length} board-role links\n`);

    // Step 3: Create board roles map (EXACTLY as in comparison.tsx)
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

    // Step 4: Check LinkedIn and Indeed roles
    console.log('📌 LinkedIn and Indeed roles after mapping:\n');
    
    const linkedInBoard = boardsData.find(b => b.name === 'LinkedIn');
    const indeedBoard = boardsData.find(b => b.name === 'Indeed');

    if (linkedInBoard) {
      const roles = boardRolesMap[linkedInBoard.id] || [];
      console.log(`LinkedIn (ID: ${linkedInBoard.id}):`);
      console.log(`  Roles array: [${roles.join(', ')}]`);
      console.log(`  Has "Product Manager": ${roles.includes('Product Manager') ? '✅ YES' : '❌ NO'}\n`);
    }

    if (indeedBoard) {
      const roles = boardRolesMap[indeedBoard.id] || [];
      console.log(`Indeed (ID: ${indeedBoard.id}):`);
      console.log(`  Roles array: [${roles.join(', ')}]`);
      console.log(`  Has "Product Manager": ${roles.includes('Product Manager') ? '✅ YES' : '❌ NO'}\n`);
    }

    // Step 5: Map boards to comparison rows (simplified version without random values)
    console.log('📊 Boards being passed to frontend:\n');
    
    const comparisonRows = (boardsData || []).map((board, index) => {
      const boardRoles = boardRolesMap[board.id] || [];
      return {
        id: board.id,
        name: board.name,
        industry: board.industry,
        roles: boardRoles,
      };
    });

    // Find LinkedIn and Indeed in comparison rows
    const linkedInRow = comparisonRows.find(b => b.name === 'LinkedIn');
    const indeedRow = comparisonRows.find(b => b.name === 'Indeed');

    if (linkedInRow) {
      console.log(`LinkedIn (for frontend):`);
      console.log(`  roles: ${JSON.stringify(linkedInRow.roles)}`);
    } else {
      console.log('❌ LinkedIn NOT found in comparison rows!');
    }

    if (indeedRow) {
      console.log(`Indeed (for frontend):`);
      console.log(`  roles: ${JSON.stringify(indeedRow.roles)}`);
    } else {
      console.log('❌ Indeed NOT found in comparison rows!');
    }

    // Step 6: Test the filter logic
    console.log('\n\n🔬 TESTING FILTER LOGIC:\n');

    const selectedRole = 'Product Manager';
    console.log(`Filter: Role = "${selectedRole}"\n`);

    const filtered = comparisonRows.filter((b) => {
      const roleMatch = selectedRole === 'All Roles' || b.roles.includes(selectedRole);
      return roleMatch;
    });

    console.log(`Total boards that match: ${filtered.length}`);
    console.log('\nMatching boards:');
    filtered.forEach(b => {
      console.log(`  - ${b.name} (roles: ${b.roles.join(', ')})`);
    });

    console.log('\n\nLinkedIn match:', filtered.some(b => b.name === 'LinkedIn') ? '✅ YES' : '❌ NO');
    console.log('Indeed match:', filtered.some(b => b.name === 'Indeed') ? '✅ YES' : '❌ NO');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
