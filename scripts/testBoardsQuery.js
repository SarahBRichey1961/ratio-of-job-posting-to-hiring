const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://blhrazwlfzrclwaluqak.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0'
);

(async () => {
  console.log('🔍 CHECKING IF LINKEDIN AND INDEED ARE IN THE BOARDS TABLE\n');

  // Check the exact boards query
  const { data: allBoards } = await supabase
    .from('job_boards')
    .select('id, name, industry, url');

  console.log(`Total boards in database: ${allBoards?.length || 0}\n`);

  // Find LinkedIn and Indeed
  const linkedIn = allBoards?.find(b => b.name === 'LinkedIn');
  const indeed = allBoards?.find(b => b.name === 'Indeed');

  if (linkedIn) {
    console.log('✅ LinkedIn found:');
    console.log(`  ID: ${linkedIn.id}`);
    console.log(`  Industry: ${linkedIn.industry}`);
    console.log(`  URL: ${linkedIn.url}\n`);
  } else {
    console.log('❌ LinkedIn NOT FOUND\n');
  }

  if (indeed) {
    console.log('✅ Indeed found:');
    console.log(`  ID: ${indeed.id}`);
    console.log(`  Industry: ${indeed.industry}`);
    console.log(`  URL: ${indeed.url}\n`);
  } else {
    console.log('❌ Indeed NOT FOUND\n');
  }

  // List all boards by industry
  console.log('\n📊 ALL BOARDS BY INDUSTRY:\n');
  const byIndustry = {};
  allBoards?.forEach(board => {
    if (!byIndustry[board.industry]) {
      byIndustry[board.industry] = [];
    }
    byIndustry[board.industry].push(board.name);
  });

  Object.keys(byIndustry).sort().forEach(industry => {
    console.log(`${industry}: ${byIndustry[industry].length} boards`);
    if (byIndustry[industry].includes('LinkedIn') || byIndustry[industry].includes('Indeed')) {
      console.log(`  → ${byIndustry[industry].join(', ')}`);
    }
  });
})();
