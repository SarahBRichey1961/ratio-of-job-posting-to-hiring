const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

// Create a new client instance to refresh schema cache
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedIndustries() {
  const boards = [
    { name: 'Dice', url: 'https://www.dice.com', category: 'tech', industry: 'Technology', description: 'Tech-focused job board for IT and software roles' },
    { name: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', category: 'tech', industry: 'Technology', description: 'Developer jobs on Stack Overflow platform' },
    { name: 'Built In', url: 'https://builtin.com/jobs', category: 'tech', industry: 'Technology', description: 'Tech jobs with company insights' },
    { name: 'AngelList Talent', url: 'https://angel.co/jobs', category: 'tech', industry: 'Technology', description: 'Startup and tech jobs on AngelList' },
    { name: 'Hired', url: 'https://hired.com', category: 'tech', industry: 'Technology', description: 'Reverse recruitment for tech professionals' },
    { name: 'ConstructionJobs.com', url: 'https://www.constructionjobs.com', category: 'niche', industry: 'Construction', description: 'Dedicated construction job board' },
    { name: 'iHireConstruction', url: 'https://www.ihireconstruction.com', category: 'niche', industry: 'Construction', description: 'Construction and skilled trades jobs' },
    { name: 'Roadtechs', url: 'https://www.roadtechs.com', category: 'niche', industry: 'Construction', description: 'Road and highway construction jobs' },
    { name: 'Tradesmen International', url: 'https://jobs.tradesmeninternational.com', category: 'niche', industry: 'Construction', description: 'Skilled trades and union jobs' },
    { name: 'TruckersReport Jobs', url: 'https://www.thetruckersreport.com/jobs', category: 'niche', industry: 'Transportation & Logistics', description: 'Truck driving and transportation jobs' },
    { name: 'CDL Job Now', url: 'https://cdljobnow.com', category: 'niche', industry: 'Transportation & Logistics', description: 'CDL and commercial driver jobs' },
    { name: 'JobsInLogistics', url: 'https://www.jobsinlogistics.com', category: 'niche', industry: 'Transportation & Logistics', description: 'Logistics and supply chain jobs' },
    { name: 'FleetJobs', url: 'https://www.fleetjobs.com', category: 'niche', industry: 'Transportation & Logistics', description: 'Fleet management and driving jobs' },
    { name: 'HCareers', url: 'https://www.hcareers.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Hospitality and food service jobs' },
    { name: 'Poached Jobs', url: 'https://poachedjobs.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Chef and culinary positions' },
    { name: 'Culinary Agents', url: 'https://culinaryagents.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Executive chef and culinary jobs' },
    { name: 'AllRetailJobs', url: 'https://www.allretailjobs.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Retail store and sales positions' },
    { name: 'Behance Job Board', url: 'https://www.behance.net/joblist', category: 'niche', industry: 'Creative & Media', description: 'Creative and design jobs' },
    { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', category: 'niche', industry: 'Creative & Media', description: 'Designer and creative roles' },
    { name: 'We Work Remotely', url: 'https://weworkremotely.com', category: 'remote', industry: 'Creative & Media', description: 'Remote creative jobs' },
    { name: 'The Muse', url: 'https://www.themuse.com/jobs', category: 'general', industry: 'Creative & Media', description: 'Career discovery with creative positions' },
    { name: 'BioSpace', url: 'https://www.biospace.com/jobs', category: 'niche', industry: 'Science & Biotech', description: 'Biotech and life sciences jobs' },
    { name: 'Science Careers', url: 'https://jobs.sciencecareers.org', category: 'niche', industry: 'Science & Biotech', description: 'Science and research positions' },
    { name: 'Nature Careers', url: 'https://www.nature.com/naturecareers', category: 'niche', industry: 'Science & Biotech', description: 'Scientific research jobs' },
    { name: 'PharmiWeb', url: 'https://www.pharmiweb.jobs', category: 'niche', industry: 'Science & Biotech', description: 'Pharmaceutical and biotech careers' },
    { name: 'HigherEdJobs', url: 'https://www.higheredjobs.com', category: 'niche', industry: 'Education', description: 'Higher education positions' },
    { name: 'Chronicle Jobs', url: 'https://jobs.chronicle.com', category: 'niche', industry: 'Education', description: 'Academic and university jobs' },
    { name: 'K12JobSpot', url: 'https://www.k12jobspot.com', category: 'niche', industry: 'Education', description: 'K-12 teaching positions' },
    { name: 'TeachAway', url: 'https://www.teachaway.com', category: 'niche', industry: 'Education', description: 'Teaching jobs worldwide' },
    { name: 'USAJobs', url: 'https://www.usajobs.gov', category: 'general', industry: 'Government', description: 'US federal government positions' },
    { name: 'GovernmentJobs.com', url: 'https://www.governmentjobs.com', category: 'general', industry: 'Government', description: 'State and local government jobs' },
    { name: 'Careers in Government', url: 'https://www.careersingovernment.com', category: 'niche', industry: 'Government', description: 'Public sector career opportunities' },
    { name: 'eFinancialCareers', url: 'https://www.efinancialcareers.com', category: 'niche', industry: 'Finance & Accounting', description: 'Finance and banking jobs' },
    { name: 'AccountingJobsToday', url: 'https://www.accountingjobstoday.com', category: 'niche', industry: 'Finance & Accounting', description: 'Accounting and CPA positions' },
    { name: 'FinancialJobBank', url: 'https://www.financialjobbank.com', category: 'niche', industry: 'Finance & Accounting', description: 'Financial services careers' },
    { name: 'LawCrossing', url: 'https://www.lawcrossing.com', category: 'niche', industry: 'Legal', description: 'Legal and attorney positions' },
    { name: 'NALP Jobs', url: 'https://jobs.nalp.org', category: 'niche', industry: 'Legal', description: 'Law firm and legal careers' },
    { name: 'LawJobs.com', url: 'https://www.lawjobs.com', category: 'niche', industry: 'Legal', description: 'Dedicated legal job board' },
    { name: 'ManufacturingJobs.com', url: 'https://www.manufacturingjobs.com', category: 'niche', industry: 'Manufacturing', description: 'Manufacturing and industrial jobs' },
    { name: 'iHireManufacturing', url: 'https://www.ihiremanufacturing.com', category: 'niche', industry: 'Manufacturing', description: 'Factory and plant positions' },
    { name: 'Engineering.com Jobs', url: 'https://www.engineering.com/jobs', category: 'niche', industry: 'Manufacturing', description: 'Engineering and technical roles' },
    { name: 'RemoteOK', url: 'https://remoteok.com', category: 'remote', industry: 'Remote', description: 'Fully remote positions across industries' },
    { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'remote', industry: 'Remote', description: 'Flexible and remote job board (premium)' },
    { name: 'Working Nomads', url: 'https://www.workingnomads.com', category: 'remote', industry: 'Remote', description: 'Jobs for digital nomads and remote workers' },
  ];
  
  console.log('⏳ Waiting for schema cache to refresh (10s)...');
  await sleep(10000);
  
  console.log('🔄 Seeding industries and job boards...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const board of boards) {
    try {
      const { data, error } = await supabase
        .from('job_boards')
        .insert([board])
        .select();
      
      if (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          console.log(`⚠️  ${board.name} (already exists)`);
          skipCount++;
        } else if (error.message.includes('schema cache')) {
          console.log(`⏳ ${board.name} (schema cache issue, trying again...)`);
          await sleep(500);
          const retry = await supabase.from('job_boards').insert([board]).select();
          if (!retry.error) {
            console.log(`✅ ${board.name} (retry successful)`);
            successCount++;
          } else {
            console.log(`❌ ${board.name}: ${retry.error.message}`);
            errorCount++;
          }
        } else {
          console.log(`❌ ${board.name}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`✅ ${board.name}`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${board.name}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Added: ${successCount}`);
  console.log(`   ⚠️  Skipped (existing): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (successCount > 0 || skipCount > 0) {
    console.log(`\n✅ Done! Now run: npm run build && reload your home page`);
  }
}

seedIndustries().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
