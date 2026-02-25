const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blhrazwlfzrclwaluqak.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

async function seedWithFresh() {
  console.log('🟢 Creating fresh Supabase client...');
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  const boards = [
    { name: 'Dice', url: 'https://www.dice.com', category: 'tech', industry: 'Technology' },
    { name: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', category: 'tech', industry: 'Technology' },
    { name: 'Built In', url: 'https://builtin.com/jobs', category: 'tech', industry: 'Technology' },
    { name: 'AngelList Talent', url: 'https://angel.co/jobs', category: 'tech', industry: 'Technology' },
    { name: 'Hired', url: 'https://hired.com', category: 'tech', industry: 'Technology' },
    { name: 'ConstructionJobs.com', url: 'https://www.constructionjobs.com', category: 'niche', industry: 'Construction' },
    { name: 'iHireConstruction', url: 'https://www.ihireconstruction.com', category: 'niche', industry: 'Construction' },
    { name: 'Roadtechs', url: 'https://www.roadtechs.com', category: 'niche', industry: 'Construction' },
    { name: 'Tradesmen International', url: 'https://jobs.tradesmeninternational.com', category: 'niche', industry: 'Construction' },
    { name: 'TruckersReport Jobs', url: 'https://www.thetruckersreport.com/jobs', category: 'niche', industry: 'Transportation & Logistics' },
    { name: 'CDL Job Now', url: 'https://cdljobnow.com', category: 'niche', industry: 'Transportation & Logistics' },
    { name: 'JobsInLogistics', url: 'https://www.jobsinlogistics.com', category: 'niche', industry: 'Transportation & Logistics' },
    { name: 'FleetJobs', url: 'https://www.fleetjobs.com', category: 'niche', industry: 'Transportation & Logistics' },
    { name: 'HCareers', url: 'https://www.hcareers.com', category: 'niche', industry: 'Retail & Hospitality' },
    { name: 'Poached Jobs', url: 'https://poachedjobs.com', category: 'niche', industry: 'Retail & Hospitality' },
    { name: 'Culinary Agents', url: 'https://culinaryagents.com', category: 'niche', industry: 'Retail & Hospitality' },
    { name: 'AllRetailJobs', url: 'https://www.allretailjobs.com', category: 'niche', industry: 'Retail & Hospitality' },
    { name: 'Behance Job Board', url: 'https://www.behance.net/joblist', category: 'niche', industry: 'Creative & Media' },
    { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', category: 'niche', industry: 'Creative & Media' },
    { name: 'We Work Remotely', url: 'https://weworkremotely.com', category: 'remote', industry: 'Creative & Media' },
    { name: 'The Muse', url: 'https://www.themuse.com/jobs', category: 'general', industry: 'Creative & Media' },
    { name: 'BioSpace', url: 'https://www.biospace.com/jobs', category: 'niche', industry: 'Science & Biotech' },
    { name: 'Science Careers', url: 'https://jobs.sciencecareers.org', category: 'niche', industry: 'Science & Biotech' },
    { name: 'Nature Careers', url: 'https://www.nature.com/naturecareers', category: 'niche', industry: 'Science & Biotech' },
    { name: 'PharmiWeb', url: 'https://www.pharmiweb.jobs', category: 'niche', industry: 'Science & Biotech' },
    { name: 'HigherEdJobs', url: 'https://www.higheredjobs.com', category: 'niche', industry: 'Education' },
    { name: 'Chronicle Jobs', url: 'https://jobs.chronicle.com', category: 'niche', industry: 'Education' },
    { name: 'K12JobSpot', url: 'https://www.k12jobspot.com', category: 'niche', industry: 'Education' },
    { name: 'TeachAway', url: 'https://www.teachaway.com', category: 'niche', industry: 'Education' },
    { name: 'USAJobs', url: 'https://www.usajobs.gov', category: 'general', industry: 'Government' },
    { name: 'GovernmentJobs.com', url: 'https://www.governmentjobs.com', category: 'general', industry: 'Government' },
    { name: 'Careers in Government', url: 'https://www.careersingovernment.com', category: 'niche', industry: 'Government' },
    { name: 'eFinancialCareers', url: 'https://www.efinancialcareers.com', category: 'niche', industry: 'Finance & Accounting' },
    { name: 'AccountingJobsToday', url: 'https://www.accountingjobstoday.com', category: 'niche', industry: 'Finance & Accounting' },
    { name: 'FinancialJobBank', url: 'https://www.financialjobbank.com', category: 'niche', industry: 'Finance & Accounting' },
    { name: 'LawCrossing', url: 'https://www.lawcrossing.com', category: 'niche', industry: 'Legal' },
    { name: 'NALP Jobs', url: 'https://jobs.nalp.org', category: 'niche', industry: 'Legal' },
    { name: 'LawJobs.com', url: 'https://www.lawjobs.com', category: 'niche', industry: 'Legal' },
    { name: 'ManufacturingJobs.com', url: 'https://www.manufacturingjobs.com', category: 'niche', industry: 'Manufacturing' },
    { name: 'iHireManufacturing', url: 'https://www.ihiremanufacturing.com', category: 'niche', industry: 'Manufacturing' },
    { name: 'Engineering.com Jobs', url: 'https://www.engineering.com/jobs', category: 'niche', industry: 'Manufacturing' },
    { name: 'RemoteOK', url: 'https://remoteok.com', category: 'remote', industry: 'Remote' },
    { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'remote', industry: 'Remote' },
    { name: 'Working Nomads', url: 'https://www.workingnomads.com', category: 'remote', industry: 'Remote' },
  ];
  
  console.log(`\n🔄 Seeding ${boards.length} job boards...\n`);
  
  let success = 0, skip = 0, error = 0;
  
  for (const board of boards) {
    try {
      const { error: insertError } = await supabase
        .from('job_boards')
        .insert([board]);
      
      if (!insertError) {
        console.log(`✅ ${board.name}`);
        success++;
      } else if (insertError.code === '23505') {
        console.log(`⚠️  ${board.name} (exists)`);
        skip++;
      } else {
        console.log(`❌ ${board.name}: ${insertError.message}`);
        error++;
      }
    } catch (e) {
      console.log(`❌ ${board.name}: ${e.message}`);
      error++;
    }
  }
  
  console.log(`\n📊 Results: ${success} added, ${skip} skipped, ${error} errors`);
  process.exit(error > 0 ? 1 : 0);
}

seedWithFresh().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
