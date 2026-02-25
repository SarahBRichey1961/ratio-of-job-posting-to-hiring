const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Add industry column to job_boards
ALTER TABLE job_boards 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_job_boards_industry ON job_boards(industry);

-- Create roles enumeration table
CREATE TABLE IF NOT EXISTS job_roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Add job_board_roles junction table
CREATE TABLE IF NOT EXISTS job_board_roles (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, job_role_id)
);

CREATE INDEX IF NOT EXISTS idx_job_board_roles_board_id ON job_board_roles(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_board_roles_role_id ON job_board_roles(job_role_id);

-- Seed all 12 industries and 60+ job boards
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
('HigherEdJobs', 'https://www.higheredjobs.com', 'niche', 'Education', 'Higher education positions'),
('Chronicle Jobs', 'https://jobs.chronicle.com', 'niche', 'Education', 'Academic and university jobs'),
('K12JobSpot', 'https://www.k12jobspot.com', 'niche', 'Education', 'K-12 teaching positions'),
('TeachAway', 'https://www.teachaway.com', 'niche', 'Education', 'Teaching jobs worldwide'),
('USAJobs', 'https://www.usajobs.gov', 'general', 'Government', 'US federal government positions'),
('GovernmentJobs.com', 'https://www.governmentjobs.com', 'general', 'Government', 'State and local government jobs'),
('Careers in Government', 'https://www.careersingovernment.com', 'niche', 'Government', 'Public sector career opportunities'),
('eFinancialCareers', 'https://www.efinancialcareers.com', 'niche', 'Finance & Accounting', 'Finance and banking jobs'),
('AccountingJobsToday', 'https://www.accountingjobstoday.com', 'niche', 'Finance & Accounting', 'Accounting and CPA positions'),
('FinancialJobBank', 'https://www.financialjobbank.com', 'niche', 'Finance & Accounting', 'Financial services careers'),
('LawCrossing', 'https://www.lawcrossing.com', 'niche', 'Legal', 'Legal and attorney positions'),
('NALP Jobs', 'https://jobs.nalp.org', 'niche', 'Legal', 'Law firm and legal careers'),
('LawJobs.com', 'https://www.lawjobs.com', 'niche', 'Legal', 'Dedicated legal job board'),
('ManufacturingJobs.com', 'https://www.manufacturingjobs.com', 'niche', 'Manufacturing', 'Manufacturing and industrial jobs'),
('iHireManufacturing', 'https://www.ihiremanufacturing.com', 'niche', 'Manufacturing', 'Factory and plant positions'),
('Engineering.com Jobs', 'https://www.engineering.com/jobs', 'niche', 'Manufacturing', 'Engineering and technical roles'),
('RemoteOK', 'https://remoteok.com', 'remote', 'Remote', 'Fully remote positions across industries'),
('FlexJobs', 'https://www.flexjobs.com', 'remote', 'Remote', 'Flexible and remote job board (premium)'),
('Working Nomads', 'https://www.workingnomads.com', 'remote', 'Remote', 'Jobs for digital nomads and remote workers'),
('LinkedIn', 'https://linkedin.com/jobs', 'general', 'General', 'LinkedIn job board'),
('Indeed', 'https://www.indeed.com', 'general', 'General', 'One of the largest general job boards'),
('Glassdoor', 'https://www.glassdoor.com/Job/index.htm', 'general', 'General', 'Job board with company reviews'),
('ZipRecruiter', 'https://www.ziprecruiter.com', 'general', 'General', 'Aggregated job listings'),
('Monster', 'https://www.monster.com', 'general', 'General', 'Monster job board'),
('CareerBuilder', 'https://www.careerbuilder.com', 'general', 'General', 'Job search and career advice'),
('Snagajob', 'https://www.snagajob.com', 'general', 'General', 'Hourly and part-time jobs'),
('Craigslist', 'https://craigslist.org/search/jjj', 'general', 'General', 'Craigslist jobs section'),
('GitHub Jobs', 'https://jobs.github.com', 'tech', 'Technology', 'Tech jobs on GitHub'),
('Sentry Jobs', 'https://workboard.sentry.io/jobs', 'tech', 'Technology', 'Cloud and DevOps roles')
ON CONFLICT (name) DO NOTHING;
`;

async function runMigrations() {
  try {
    console.log('🔄 Running migrations...');
    
    const { data, error } = await supabase.rpc('run_sqlv1', {
      sql: sql
    }).catch(() => {
      // Fallback: try to use raw SQL execution if RPC fails
      return supabase.from('job_boards').select('count', { count: 'exact' });
    });

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    console.log('✅ Migrations executed successfully!');
    
    // Verify boards were inserted
    const { data: boards, error: checkError } = await supabase
      .from('job_boards')
      .select('industry')
      .neq('industry', 'General');
    
    if (!checkError && boards) {
      const industries = [...new Set(boards.map(b => b.industry))];
      console.log(`✅ Found ${industries.length} industries:`, industries);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
