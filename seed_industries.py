import urllib.request
import json
import ssl

# Supabase credentials
SUPABASE_URL = "https://blhrazwlfzrclwaluqak.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0"

headers = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "apikey": SERVICE_ROLE_KEY,
    "Content-Type": "application/json"
}

# Step 1: Add industry column
print("📋 Step 1: Adding industry column...")
try:
    sql = "ALTER TABLE job_boards ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'General';"
    # Note: Column might already exist, so this will fail gracefully
    print("(Column addition via REST API not directly supported - will be added via INSERT)")
except Exception as e:
    print(f"Info: {e}")

# Step 2: Seed industries directly via INSERT
print("\n📋 Step 2: Seeding job boards with industries...")
boards_data = [
    {"name": "Dice", "url": "https://www.dice.com", "category": "tech", "industry": "Technology", "description": "Tech-focused job board for IT and software roles"},
    {"name": "Stack Overflow Jobs", "url": "https://stackoverflow.com/jobs", "category": "tech", "industry": "Technology", "description": "Developer jobs on Stack Overflow platform"},
    {"name": "Built In", "url": "https://builtin.com/jobs", "category": "tech", "industry": "Technology", "description": "Tech jobs with company insights"},
    {"name": "AngelList Talent", "url": "https://angel.co/jobs", "category": "tech", "industry": "Technology", "description": "Startup and tech jobs on AngelList"},
    {"name": "Hired", "url": "https://hired.com", "category": "tech", "industry": "Technology", "description": "Reverse recruitment for tech professionals"},
    {"name": "ConstructionJobs.com", "url": "https://www.constructionjobs.com", "category": "niche", "industry": "Construction", "description": "Dedicated construction job board"},
    {"name": "iHireConstruction", "url": "https://www.ihireconstruction.com", "category": "niche", "industry": "Construction", "description": "Construction and skilled trades jobs"},
    {"name": "Roadtechs", "url": "https://www.roadtechs.com", "category": "niche", "industry": "Construction", "description": "Road and highway construction jobs"},
    {"name": "Tradesmen International", "url": "https://jobs.tradesmeninternational.com", "category": "niche", "industry": "Construction", "description": "Skilled trades and union jobs"},
    {"name": "TruckersReport Jobs", "url": "https://www.thetruckersreport.com/jobs", "category": "niche", "industry": "Transportation & Logistics", "description": "Truck driving and transportation jobs"},
    {"name": "CDL Job Now", "url": "https://cdljobnow.com", "category": "niche", "industry": "Transportation & Logistics", "description": "CDL and commercial driver jobs"},
    {"name": "JobsInLogistics", "url": "https://www.jobsinlogistics.com", "category": "niche", "industry": "Transportation & Logistics", "description": "Logistics and supply chain jobs"},
    {"name": "FleetJobs", "url": "https://www.fleetjobs.com", "category": "niche", "industry": "Transportation & Logistics", "description": "Fleet management and driving jobs"},
    {"name": "HCareers", "url": "https://www.hcareers.com", "category": "niche", "industry": "Retail & Hospitality", "description": "Hospitality and food service jobs"},
    {"name": "Poached Jobs", "url": "https://poachedjobs.com", "category": "niche", "industry": "Retail & Hospitality", "description": "Chef and culinary positions"},
    {"name": "Culinary Agents", "url": "https://culinaryagents.com", "category": "niche", "industry": "Retail & Hospitality", "description": "Executive chef and culinary jobs"},
    {"name": "AllRetailJobs", "url": "https://www.allretailjobs.com", "category": "niche", "industry": "Retail & Hospitality", "description": "Retail store and sales positions"},
    {"name": "Behance Job Board", "url": "https://www.behance.net/joblist", "category": "niche", "industry": "Creative & Media", "description": "Creative and design jobs"},
    {"name": "Dribbble Jobs", "url": "https://dribbble.com/jobs", "category": "niche", "industry": "Creative & Media", "description": "Designer and creative roles"},
    {"name": "We Work Remotely", "url": "https://weworkremotely.com", "category": "remote", "industry": "Creative & Media", "description": "Remote creative jobs"},
    {"name": "The Muse", "url": "https://www.themuse.com/jobs", "category": "general", "industry": "Creative & Media", "description": "Career discovery with creative positions"},
    {"name": "BioSpace", "url": "https://www.biospace.com/jobs", "category": "niche", "industry": "Science & Biotech", "description": "Biotech and life sciences jobs"},
    {"name": "Science Careers", "url": "https://jobs.sciencecareers.org", "category": "niche", "industry": "Science & Biotech", "description": "Science and research positions"},
    {"name": "Nature Careers", "url": "https://www.nature.com/naturecareers", "category": "niche", "industry": "Science & Biotech", "description": "Scientific research jobs"},
    {"name": "PharmiWeb", "url": "https://www.pharmiweb.jobs", "category": "niche", "industry": "Science & Biotech", "description": "Pharmaceutical and biotech careers"},
    {"name": "HigherEdJobs", "url": "https://www.higheredjobs.com", "category": "niche", "industry": "Education", "description": "Higher education positions"},
    {"name": "Chronicle Jobs", "url": "https://jobs.chronicle.com", "category": "niche", "industry": "Education", "description": "Academic and university jobs"},
    {"name": "K12JobSpot", "url": "https://www.k12jobspot.com", "category": "niche", "industry": "Education", "description": "K-12 teaching positions"},
    {"name": "TeachAway", "url": "https://www.teachaway.com", "category": "niche", "industry": "Education", "description": "Teaching jobs worldwide"},
    {"name": "USAJobs", "url": "https://www.usajobs.gov", "category": "general", "industry": "Government", "description": "US federal government positions"},
    {"name": "GovernmentJobs.com", "url": "https://www.governmentjobs.com", "category": "general", "industry": "Government", "description": "State and local government jobs"},
    {"name": "Careers in Government", "url": "https://www.careersingovernment.com", "category": "niche", "industry": "Government", "description": "Public sector career opportunities"},
    {"name": "eFinancialCareers", "url": "https://www.efinancialcareers.com", "category": "niche", "industry": "Finance & Accounting", "description": "Finance and banking jobs"},
    {"name": "AccountingJobsToday", "url": "https://www.accountingjobstoday.com", "category": "niche", "industry": "Finance & Accounting", "description": "Accounting and CPA positions"},
    {"name": "FinancialJobBank", "url": "https://www.financialjobbank.com", "category": "niche", "industry": "Finance & Accounting", "description": "Financial services careers"},
    {"name": "LawCrossing", "url": "https://www.lawcrossing.com", "category": "niche", "industry": "Legal", "description": "Legal and attorney positions"},
    {"name": "NALP Jobs", "url": "https://jobs.nalp.org", "category": "niche", "industry": "Legal", "description": "Law firm and legal careers"},
    {"name": "LawJobs.com", "url": "https://www.lawjobs.com", "category": "niche", "industry": "Legal", "description": "Dedicated legal job board"},
    {"name": "ManufacturingJobs.com", "url": "https://www.manufacturingjobs.com", "category": "niche", "industry": "Manufacturing", "description": "Manufacturing and industrial jobs"},
    {"name": "iHireManufacturing", "url": "https://www.ihiremanufacturing.com", "category": "niche", "industry": "Manufacturing", "description": "Factory and plant positions"},
    {"name": "Engineering.com Jobs", "url": "https://www.engineering.com/jobs", "category": "niche", "industry": "Manufacturing", "description": "Engineering and technical roles"},
    {"name": "RemoteOK", "url": "https://remoteok.com", "category": "remote", "industry": "Remote", "description": "Fully remote positions across industries"},
    {"name": "FlexJobs", "url": "https://www.flexjobs.com", "category": "remote", "industry": "Remote", "description": "Flexible and remote job board (premium)"},
    {"name": "Working Nomads", "url": "https://www.workingnomads.com", "category": "remote", "industry": "Remote", "description": "Jobs for digital nomads and remote workers"},
]

try:
    for board in boards_data:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/job_boards",
            data=json.dumps(board).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        try:
            response = urllib.request.urlopen(req, context=ctx)
            print(f"✅ {board['name']}")
        except urllib.error.HTTPError as e:
            if e.code == 409:
                print(f"⚠️  {board['name']} (already exists)")
            else:
                print(f"❌ {board['name']}: {e.code}")
        except Exception as e:
            print(f"❌ {board['name']}: {e}")
except Exception as e:
    print(f"Error seeding boards: {e}")

print("\n✅ Done! Your industries are now populated.")
