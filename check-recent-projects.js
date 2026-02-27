const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://eikhrkharihagaorqqcf.supabase.co',
  'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'
);

async function checkRecentProjects() {
  try {
    console.log('Checking recent projects...\n');

    const { data, error } = await supabase
      .from('hub_projects')
      .select('id, title, learning_goals, technologies_used, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} recent projects:\n`);
    data?.forEach((project, idx) => {
      console.log(`${idx + 1}. ${project.title}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Created: ${project.created_at}`);
      console.log(`   Learning Goals: ${JSON.stringify(project.learning_goals)}`);
      console.log(`   Technologies: ${JSON.stringify(project.technologies_used)}`);
      console.log();
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRecentProjects();
