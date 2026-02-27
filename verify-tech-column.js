const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking hub_projects schema...\n');

    // Try to query the information schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'hub_projects')
      .eq('table_schema', 'public');

    if (error) {
      console.log('Cannot access information_schema directly');
      console.log('Trying alternative approach...\n');
      
      // Try fetching a project and checking what Supabase returns
      const { data: projects, error: err } = await supabase
        .from('hub_projects')
        .select('*')
        .limit(1);

      if (err) {
        console.error('Error:', err);
        return;
      }

      if (projects && projects.length > 0) {
        console.log('Sample project columns:');
        console.log(Object.keys(projects[0]));
        console.log('\nFull sample data:');
        console.log(JSON.stringify(projects[0], null, 2));
      } else {
        console.log('No projects found');
      }
    } else {
      console.log('Columns in hub_projects:');
      data?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
