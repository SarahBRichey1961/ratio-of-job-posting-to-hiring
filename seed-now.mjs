import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://blhrazwlfzrclwaluqak.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

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
  { name: 'HigherEdJobs', url: 'https://www.higheredjobs.com', category: 'niche', industry: 'Education', description: 'University and faculty positions' },
  { name: 'Chronicle Jobs', url: 'https://jobs.chronicle.com', category: 'niche', industry: 'Education', description: 'Academic and research positions' },
  { name: 'K12JobSpot', url: 'https://www.k12jobspot.com', category: 'niche', industry: 'Education', description: 'K-12 and school district jobs' },
  { name: 'TeachAway', url: 'https://www.teachaway.com', category: 'niche', industry: 'Education', description: 'Teaching jobs at schools worldwide' },
  { name: 'USAJobs', url: 'https://www.usajobs.gov', category: 'general', industry: 'Government', description: 'Official US federal government jobs' },
  { name: 'GovernmentJobs.com', url: 'https://www.governmentjobs.com', category: 'general', industry: 'Government', description: 'State and local government positions' },
  { name: 'Careers in Government', url: 'https://www.careersingovernment.com', category: 'niche', industry: 'Government', description: 'Public sector career board' },
  { name: 'eFinancialCareers', url: 'https://www.efinancialcareers.com', category: 'niche', industry: 'Finance & Accounting', description: 'Finance and banking jobs' },
  { name: 'AccountingJobsToday', url: 'https://www.accountingjobstoday.com', category: 'niche', industry: 'Finance & Accounting', description: 'Accounting and CPA positions' },
  { name: 'FinancialJobBank', url: 'https://www.financialjobbank.com', category: 'niche', industry: 'Finance & Accounting', description: 'Financial services and banking' },
  { name: 'LawCrossing', url: 'https://www.lawcrossing.com', category: 'niche', industry: 'Legal', description: 'Lawyer and legal professional jobs' },
  { name: 'NALP Jobs', url: 'https://jobs.nalp.org', category: 'niche', industry: 'Legal', description: 'Law firm and legal positions' },
  { name: 'LawJobs.com', url: 'https://www.lawjobs.com', category: 'niche', industry: 'Legal', description: 'Attorney and legal career board' },
  { name: 'ManufacturingJobs.com', url: 'https://www.manufacturingjobs.com', category: 'niche', industry: 'Manufacturing', description: 'Manufacturing and factory jobs' },
  { name: 'iHireManufacturing', url: 'https://www.ihiremanufacturing.com', category: 'niche', industry: 'Manufacturing', description: 'Factory and production positions' },
  { name: 'Engineering.com Jobs', url: 'https://www.engineering.com/jobs', category: 'niche', industry: 'Manufacturing', description: 'Engineering and technical jobs' },
  { name: 'RemoteOK', url: 'https://remoteok.com', category: 'remote', industry: 'Remote', description: 'Remote jobs across all industries' },
  { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'remote', industry: 'Remote', description: 'Flexible and remote positions' },
  { name: 'Working Nomads', url: 'https://www.workingnomads.com', category: 'remote', industry: 'Remote', description: 'Remote work for digital nomads' },
];

async function main() {
  console.log('🚀 Seeding industries and job boards...\n');

  try {
    // First check if tables exist
    console.log('🔍 Checking database...');
    const { data: existingBoards, error: checkError } = await supabase
      .from('job_boards')
      .select('industry')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking tables:', checkError.message);
      console.log('\n⚠️  Tables may not exist. Please run all-migrations.sql in Supabase first!');
      process.exit(1);
    }

    console.log('✅ Tables exist!\n');

    // Insert boards one by one to avoid bulk issues
    console.log('📝 Inserting 44 job boards...\n');
    let successCount = 0;

    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      const { error } = await supabase
        .from('job_boards')
        .insert([board]);

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('CONFLICT')) {
          console.log(`⚠️  ${board.name} (already exists)`);
        } else {
          console.log(`❌ ${board.name}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${board.name}`);
        successCount++;
      }

      // Small delay to avoid rate limiting
      if ((i + 1) % 5 === 0) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    console.log(`\n✅ Seeding complete! ${successCount} new boards inserted.\n`);

    // Verify
    const { data: industries, error: industryError } = await supabase
      .from('job_boards')
      .select('industry')
      .distinct();

    if (industryError) {
      console.error('Verification error:', industryError);
    } else {
      const uniqueIndustries = [...new Set(industries.map(r => r.industry))];
      console.log(`📊 Industries in database (${uniqueIndustries.length}):`);
      uniqueIndustries.sort().forEach(ind => console.log(`   • ${ind}`));
    }

    console.log('\n🎉 Done! Refresh http://localhost:3000 to see the industries.\n');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
