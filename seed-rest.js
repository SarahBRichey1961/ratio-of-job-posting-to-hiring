const https = require('https');

const PROJECT_ID = 'blhrazwlfzrclwaluqak';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const boards = [
  { name: 'Dice', url: 'https://www.dice.com', category: 'tech', industry: 'Technology', description: 'Tech-focused job board' },
  { name: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', category: 'tech', industry: 'Technology', description: 'Developer jobs' },
  { name: 'Built In', url: 'https://builtin.com/jobs', category: 'tech', industry: 'Technology', description: 'Tech jobs' },
  { name: 'AngelList Talent', url: 'https://angel.co/jobs', category: 'tech', industry: 'Technology', description: 'Startup jobs' },
  { name: 'Hired', url: 'https://hired.com', category: 'tech', industry: 'Technology', description: 'Reverse recruitment' },
  { name: 'ConstructionJobs.com', url: 'https://www.constructionjobs.com', category: 'niche', industry: 'Construction', description: 'Construction jobs' },
  { name: 'iHireConstruction', url: 'https://www.ihireconstruction.com', category: 'niche', industry: 'Construction', description: 'Trades jobs' },
  { name: 'Roadtechs', url: 'https://www.roadtechs.com', category: 'niche', industry: 'Construction', description: 'Road construction' },
  { name: 'Tradesmen International', url: 'https://jobs.tradesmeninternational.com', category: 'niche', industry: 'Construction', description: 'Union jobs' },
  { name: 'TruckersReport Jobs', url: 'https://www.thetruckersreport.com/jobs', category: 'niche', industry: 'Transportation & Logistics', description: 'Truck driving' },
  { name: 'CDL Job Now', url: 'https://cdljobnow.com', category: 'niche', industry: 'Transportation & Logistics', description: 'CDL jobs' },
  { name: 'JobsInLogistics', url: 'https://www.jobsinlogistics.com', category: 'niche', industry: 'Transportation & Logistics', description: 'Logistics jobs' },
  { name: 'FleetJobs', url: 'https://www.fleetjobs.com', category: 'niche', industry: 'Transportation & Logistics', description: 'Fleet jobs' },
  { name: 'HCareers', url: 'https://www.hcareers.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Hospitality jobs' },
  { name: 'Poached Jobs', url: 'https://poachedjobs.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Culinary jobs' },
  { name: 'Culinary Agents', url: 'https://culinaryagents.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Chef jobs' },
  { name: 'AllRetailJobs', url: 'https://www.allretailjobs.com', category: 'niche', industry: 'Retail & Hospitality', description: 'Retail jobs' },
  { name: 'Behance Job Board', url: 'https://www.behance.net/joblist', category: 'niche', industry: 'Creative & Media', description: 'Creative jobs' },
  { name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', category: 'niche', industry: 'Creative & Media', description: 'Design jobs' },
  { name: 'We Work Remotely', url: 'https://weworkremotely.com', category: 'remote', industry: 'Creative & Media', description: 'Remote creative' },
  { name: 'The Muse', url: 'https://www.themuse.com/jobs', category: 'general', industry: 'Creative & Media', description: 'Career discovery' },
  { name: 'BioSpace', url: 'https://www.biospace.com/jobs', category: 'niche', industry: 'Science & Biotech', description: 'Biotech jobs' },
  { name: 'Science Careers', url: 'https://jobs.sciencecareers.org', category: 'niche', industry: 'Science & Biotech', description: 'Science jobs' },
  { name: 'Nature Careers', url: 'https://www.nature.com/naturecareers', category: 'niche', industry: 'Science & Biotech', description: 'Research jobs' },
  { name: 'PharmiWeb', url: 'https://www.pharmiweb.jobs', category: 'niche', industry: 'Science & Biotech', description: 'Pharma jobs' },
  { name: 'HigherEdJobs', url: 'https://www.higheredjobs.com', category: 'niche', industry: 'Education', description: 'University jobs' },
  { name: 'Chronicle Jobs', url: 'https://jobs.chronicle.com', category: 'niche', industry: 'Education', description: 'Academic jobs' },
  { name: 'K12JobSpot', url: 'https://www.k12jobspot.com', category: 'niche', industry: 'Education', description: 'K-12 jobs' },
  { name: 'TeachAway', url: 'https://www.teachaway.com', category: 'niche', industry: 'Education', description: 'Teaching jobs' },
  { name: 'USAJobs', url: 'https://www.usajobs.gov', category: 'general', industry: 'Government', description: 'Federal jobs' },
  { name: 'GovernmentJobs.com', url: 'https://www.governmentjobs.com', category: 'general', industry: 'Government', description: 'Government jobs' },
  { name: 'Careers in Government', url: 'https://www.careersingovernment.com', category: 'niche', industry: 'Government', description: 'Public sector' },
  { name: 'eFinancialCareers', url: 'https://www.efinancialcareers.com', category: 'niche', industry: 'Finance & Accounting', description: 'Finance jobs' },
  { name: 'AccountingJobsToday', url: 'https://www.accountingjobstoday.com', category: 'niche', industry: 'Finance & Accounting', description: 'Accounting jobs' },
  { name: 'FinancialJobBank', url: 'https://www.financialjobbank.com', category: 'niche', industry: 'Finance & Accounting', description: 'Financial jobs' },
  { name: 'LawCrossing', url: 'https://www.lawcrossing.com', category: 'niche', industry: 'Legal', description: 'Legal jobs' },
  { name: 'NALP Jobs', url: 'https://jobs.nalp.org', category: 'niche', industry: 'Legal', description: 'Law jobs' },
  { name: 'LawJobs.com', url: 'https://www.lawjobs.com', category: 'niche', industry: 'Legal', description: 'Attorney jobs' },
  { name: 'ManufacturingJobs.com', url: 'https://www.manufacturingjobs.com', category: 'niche', industry: 'Manufacturing', description: 'Manufacturing jobs' },
  { name: 'iHireManufacturing', url: 'https://www.ihiremanufacturing.com', category: 'niche', industry: 'Manufacturing', description: 'Factory jobs' },
  { name: 'Engineering.com Jobs', url: 'https://www.engineering.com/jobs', category: 'niche', industry: 'Manufacturing', description: 'Engineering jobs' },
  { name: 'RemoteOK', url: 'https://remoteok.com', category: 'remote', industry: 'Remote', description: 'Remote jobs' },
  { name: 'FlexJobs', url: 'https://www.flexjobs.com', category: 'remote', industry: 'Remote', description: 'Flexible jobs' },
  { name: 'Working Nomads', url: 'https://www.workingnomads.com', category: 'remote', industry: 'Remote', description: 'Nomad jobs' },
];

async function insertBoard(board) {
  return new Promise((resolve) => {
    const options = {
      hostname: `${PROJECT_ID}.supabase.co`,
      port: 443,
      path: '/rest/v1/job_boards',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✅ ${board.name}`);
          resolve(true);
        } else if (res.statusCode === 409) {
          console.log(`⚠️  ${board.name} (exists)`);
          resolve(true);
        } else {
          console.log(`❌ ${board.name}`);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log(`❌ ${board.name} (network error)`);
      resolve(false);
    });

    req.write(JSON.stringify(board));
    req.end();
  });
}

async function seedAll() {
  console.log(`🔄 Seeding ${boards.length} job boards via REST...\n`);
  let count = 0;
  
  for (const board of boards) {
    await insertBoard(board);
    count++;
    if (count % 10 === 0) {
      console.log(`${count}/${boards.length} inserted\n`);
      // Small delay every 10
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`\n✅ Done! Now rebuild and reload the page.`);
}

seedAll().catch(e => console.error(e));
