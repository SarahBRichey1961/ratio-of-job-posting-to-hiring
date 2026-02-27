const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

async function checkColumn() {
  try {
    console.log('Checking if technologies_used column exists in hub_projects...\n');

    // Try to select the technologies_used column
    const { data, error } = await supabase
      .from('hub_projects')
      .select('id, title, technologies_used')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      if (error.message.includes('technologies_used')) {
        console.log('\n⚠️  The technologies_used column does NOT exist!');
        console.log('\nYou need to add it manually via Supabase Dashboard:');
        console.log('1. Go to https://app.supabase.com');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Paste and run this SQL:\n');
        console.log(`ALTER TABLE hub_projects ADD COLUMN IF NOT EXISTS technologies_used TEXT[] DEFAULT ARRAY[]::TEXT[];`);
      } else {
        console.error('Different error:', error);
      }
      return;
    }

    console.log('✅ technologies_used column EXISTS!');
    console.log('Database records:');
    if (data && data.length > 0) {
      data.forEach((row, idx) => {
        console.log(`  Record ${idx + 1}: technologies_used = ${JSON.stringify(row.technologies_used)}`);
      });
    } else {
      console.log('  (No projects yet)');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkColumn();
