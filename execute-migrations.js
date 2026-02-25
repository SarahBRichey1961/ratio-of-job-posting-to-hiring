const { createClient } = require('@supabase/supabase-js');

const PROJECT_URL = 'https://blhrazwlfzrclwaluqak.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

async function runMigration017() {
  console.log('📋 Running Migration 017: Add industry column and roles table...\n');
  
  const sql = `
    -- Add industry column to job_boards
    ALTER TABLE job_boards 
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'General';

    -- Create index on industry for fast filtering
    CREATE INDEX IF NOT EXISTS idx_job_boards_industry ON job_boards(industry);

    -- Create roles enumeration table
    CREATE TABLE IF NOT EXISTS job_roles (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for lookups
    CREATE INDEX IF NOT EXISTS idx_job_roles_name ON job_roles(name);

    -- Insert standard job roles
    INSERT INTO job_roles (name, description) VALUES
    ('Frontend Developer', 'Frontend/UI developer positions'),
    ('Backend Developer', 'Server-side and backend development'),
    ('Full Stack Developer', 'Full stack development roles'),
    ('Data Scientist', 'Data science and analytics roles'),
    ('DevOps Engineer', 'DevOps, infrastructure, cloud engineering'),
    ('Product Manager', 'Product management positions'),
    ('Designer', 'UX/UI and design roles'),
    ('Sales', 'Sales and account management'),
    ('Marketing', 'Marketing and growth roles'),
    ('Operations', 'Operations and business roles'),
    ('Executive', 'C-level and executive positions'),
    ('Construction Worker', 'Construction and skilled trades'),
    ('Truck Driver', 'Transportation and logistics'),
    ('Retail', 'Retail and hospitality roles'),
    ('Accountant', 'Accounting and finance'),
    ('Lawyer', 'Legal positions'),
    ('Healthcare', 'Healthcare and medical roles'),
    ('Teacher', 'Education and teaching positions'),
    ('Scientist', 'Research and scientific positions'),
    ('Manufacturer', 'Manufacturing and production')
    ON CONFLICT (name) DO NOTHING;
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
      console.error('❌ Migration 017 failed:', error);
      return false;
    }
    console.log('✅ Migration 017 completed successfully\n');
    return true;
  } catch (err) {
    console.error('❌ Error running migration 017:', err.message);
    return false;
  }
}

async function runMigration018() {
  console.log('📋 Running Migration 018: Seed 44 job boards...\n');
  
  const sql = `
    INSERT INTO job_boards (name, url, category, industry, description) VALUES
    ('Dice', 'https://www.dice.com', 'tech', 'Technology', 'Tech-focused job board for IT and software roles'),
    ('Stack Overflow Jobs', 'https://stackoverflow.com/jobs', 'tech', 'Technology', 'Developer jobs on Stack Overflow platform'),
    ('Built In', 'https://builtin.com/jobs', 'tech', 'Technology', 'Tech jobs with company insights'),
    ('AngelList Talent', 'https://angel.co/jobs', 'tech', 'Technology', 'Startup and tech jobs on AngelList'),
    ('Hired', 'https://hired.com', 'tech', 'Technology', 'Reverse recruitment for tech professionals'),
    ('ConstructionJobs.com', 'https://www.constructionjobs.com', 'niche', 'Construction', 'Dedicated construction job board'),
    ('iHireConstruction', 'https://www.ihireconstruction.com', 'niche', 'Construction', 'Construction and skilled trades jobs'),
    ('Roadtechs', 'https://www.roadtechs.com', 'niche', 'Construction', 'Road and highway construction jobs'),
    ('Tradesmen International', 'https://jobs.tradesmeninternational.com', 'niche', 'Construction', 'Skilled trades and union jobs'),
    ('TruckersReport Jobs', 'https://www.thetruckersreport.com/jobs', 'niche', 'Transportation & Logistics', 'Truck driving and transportation jobs'),
    ('CDL Job Now', 'https://cdljobnow.com', 'niche', 'Transportation & Logistics', 'CDL and commercial driver jobs'),
    ('JobsInLogistics', 'https://www.jobsinlogistics.com', 'niche', 'Transportation & Logistics', 'Logistics and supply chain jobs'),
    ('FleetJobs', 'https://www.fleetjobs.com', 'niche', 'Transportation & Logistics', 'Fleet management and driving jobs'),
    ('HCareers', 'https://www.hcareers.com', 'niche', 'Retail & Hospitality', 'Hospitality and food service jobs'),
    ('Poached Jobs', 'https://poachedjobs.com', 'niche', 'Retail & Hospitality', 'Chef and culinary positions'),
    ('Culinary Agents', 'https://culinaryagents.com', 'niche', 'Retail & Hospitality', 'Executive chef and culinary jobs'),
    ('AllRetailJobs', 'https://www.allretailjobs.com', 'niche', 'Retail & Hospitality', 'Retail store and sales positions'),
    ('Behance Job Board', 'https://www.behance.net/joblist', 'niche', 'Creative & Media', 'Creative and design jobs'),
    ('Dribbble Jobs', 'https://dribbble.com/jobs', 'niche', 'Creative & Media', 'Designer and creative roles'),
    ('We Work Remotely', 'https://weworkremotely.com', 'remote', 'Creative & Media', 'Remote creative jobs'),
    ('The Muse', 'https://www.themuse.com/jobs', 'general', 'Creative & Media', 'Career discovery with creative positions'),
    ('BioSpace', 'https://www.biospace.com/jobs', 'niche', 'Science & Biotech', 'Biotech and life sciences jobs'),
    ('Science Careers', 'https://jobs.sciencecareers.org', 'niche', 'Science & Biotech', 'Science and research positions'),
    ('Nature Careers', 'https://www.nature.com/naturecareers', 'niche', 'Science & Biotech', 'Scientific research jobs'),
    ('PharmiWeb', 'https://www.pharmiweb.jobs', 'niche', 'Science & Biotech', 'Pharmaceutical and biotech careers'),
    ('HigherEdJobs', 'https://www.higheredjobs.com', 'niche', 'Education', 'University and faculty positions'),
    ('Chronicle Jobs', 'https://jobs.chronicle.com', 'niche', 'Education', 'Academic and research positions'),
    ('K12JobSpot', 'https://www.k12jobspot.com', 'niche', 'Education', 'K-12 and school district jobs'),
    ('TeachAway', 'https://www.teachaway.com', 'niche', 'Education', 'Teaching jobs at schools worldwide'),
    ('USAJobs', 'https://www.usajobs.gov', 'general', 'Government', 'Official US federal government jobs'),
    ('GovernmentJobs.com', 'https://www.governmentjobs.com', 'general', 'Government', 'State and local government positions'),
    ('Careers in Government', 'https://www.careersingovernment.com', 'niche', 'Government', 'Public sector career board'),
    ('eFinancialCareers', 'https://www.efinancialcareers.com', 'niche', 'Finance & Accounting', 'Finance and banking jobs'),
    ('AccountingJobsToday', 'https://www.accountingjobstoday.com', 'niche', 'Finance & Accounting', 'Accounting and CPA positions'),
    ('FinancialJobBank', 'https://www.financialjobbank.com', 'niche', 'Finance & Accounting', 'Financial services and banking'),
    ('LawCrossing', 'https://www.lawcrossing.com', 'niche', 'Legal', 'Lawyer and legal professional jobs'),
    ('NALP Jobs', 'https://jobs.nalp.org', 'niche', 'Legal', 'Law firm and legal positions'),
    ('LawJobs.com', 'https://www.lawjobs.com', 'niche', 'Legal', 'Attorney and legal career board'),
    ('ManufacturingJobs.com', 'https://www.manufacturingjobs.com', 'niche', 'Manufacturing', 'Manufacturing and factory jobs'),
    ('iHireManufacturing', 'https://www.ihiremanufacturing.com', 'niche', 'Manufacturing', 'Factory and production positions'),
    ('Engineering.com Jobs', 'https://www.engineering.com/jobs', 'niche', 'Manufacturing', 'Engineering and technical jobs'),
    ('RemoteOK', 'https://remoteok.com', 'remote', 'Remote', 'Remote jobs across all industries'),
    ('FlexJobs', 'https://www.flexjobs.com', 'remote', 'Remote', 'Flexible and remote positions'),
    ('Working Nomads', 'https://www.workingnomads.com', 'remote', 'Remote', 'Remote work for digital nomads')
    ON CONFLICT (name) DO NOTHING;
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
      console.error('❌ Migration 018 failed:', error);
      return false;
    }
    console.log('✅ Migration 018 completed: 44 job boards seeded\n');
    return true;
  } catch (err) {
    console.error('❌ Error running migration 018:', err.message);
    return false;
  }
}

async function verify() {
  console.log('🔍 Verifying industries...\n');
  
  try {
    const { data, error } = await supabase
      .from('job_boards')
      .select('industry')
      .distinct()
      .order('industry');
    
    if (error) {
      console.error('❌ Verification failed:', error);
      return;
    }

    console.log('✅ Industries in database:');
    data.forEach(row => console.log(`   • ${row.industry}`));
    
    const { count, error: countError } = await supabase
      .from('job_boards')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n✅ Total job boards: ${count}`);
    }
  } catch (err) {
    console.error('❌ Verification error:', err.message);
  }
}

async function main() {
  console.log('🚀 Executing Database Migrations\n');
  console.log('=' .repeat(50) + '\n');
  
  const result017 = await runMigration017();
  if (!result017) process.exit(1);
  
  // Wait before next migration
  await new Promise(r => setTimeout(r, 2000));
  
  const result018 = await runMigration018();
  if (!result018) process.exit(1);
  
  // Wait before verification
  await new Promise(r => setTimeout(r, 2000));
  
  await verify();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All migrations completed!\n');
  console.log('Next steps:');
  console.log('  1. npm run build');
  console.log('  2. npm run dev');
  console.log('  3. Visit http://localhost:3000 to see industries!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
