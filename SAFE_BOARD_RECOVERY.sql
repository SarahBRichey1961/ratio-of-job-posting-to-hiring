-- ============================================================================
-- SAFE BOARD RECOVERY SCRIPT
-- ============================================================================
-- This script INSERTS boards without deleting existing ones
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure all necessary tables and columns exist
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_board_roles (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, job_role_id)
);

CREATE INDEX IF NOT EXISTS idx_job_board_roles_board_id ON job_board_roles(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_board_roles_role_id ON job_board_roles(job_role_id);

ALTER TABLE job_boards ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE job_boards ADD COLUMN IF NOT EXISTS role_types TEXT;

CREATE INDEX IF NOT EXISTS idx_job_boards_industry ON job_boards(industry);

-- ============================================================================
-- STEP 2: INSERT ALL BOARDS (with conflict handling - won't delete existing)
-- ============================================================================

-- TECHNOLOGY BOARDS (20 total)
INSERT INTO job_boards (name, url, category, industry, role_types, description) VALUES
('Dice', 'https://www.dice.com', 'tech', 'Technology', 'Software Engineering, Data Science, Cybersecurity, AI/ML, Cloud Engineering, IT Operations', 'Tech-focused job board for IT and software roles'),
('Stack Overflow Jobs', 'https://stackoverflow.com/jobs', 'tech', 'Technology', 'Backend, Frontend, Full-Stack, DevOps, Cloud, QA, Engineering Leadership', 'Developer jobs on Stack Overflow platform'),
('Built In', 'https://builtin.com', 'tech', 'Technology', 'Software Engineering, Data Science, Product Management, UX/UI, DevOps, Startup Tech', 'Tech jobs with company insights'),
('AngelList Talent', 'https://angel.co/jobs', 'tech', 'Technology', 'Startup Engineering, Product, Design, Data, Founding Engineer, CTO', 'Startup and tech jobs on AngelList'),
('Hired', 'https://hired.com', 'tech', 'Technology', 'Software Engineering, Data Science, DevOps, Cloud, Product, Engineering Management', 'Reverse recruitment for tech professionals'),
('LinkedIn (Tech)', 'https://linkedin.com/jobs', 'general', 'Technology', 'Software Engineering, IT, Data, Cloud, Cybersecurity, Product, Leadership', 'Tech roles on LinkedIn Jobs platform'),
('Indeed (Tech)', 'https://indeed.com', 'general', 'Technology', 'Software Engineering, IT Support, QA, Data, Product, Cloud', 'Tech positions on Indeed platform'),
('Glassdoor (Tech)', 'https://glassdoor.com', 'general', 'Technology', 'Software Engineering, IT, Data, Cybersecurity, Product', 'Tech jobs on Glassdoor platform'),
('TechFetch', 'https://techfetch.com', 'tech', 'Technology', 'IT Consulting, Software Development, Systems Engineering, Enterprise Tech', 'Enterprise and IT consulting tech jobs'),
('CrunchBoard (TechCrunch)', 'https://jobs.techcrunch.com', 'tech', 'Technology', 'Engineering, Product, Design, IT, Startup Tech', 'Tech and startup jobs from TechCrunch'),
('Remote Tech Jobs', 'https://remotetechjobs.com', 'remote', 'Technology', 'Remote Engineering, DevOps, Cloud, Data, QA, Cybersecurity', 'Remote-first tech job board'),
('GitHub Jobs', 'https://jobs.github.com', 'tech', 'Technology', 'Open-Source Engineering, Backend, Frontend, DevOps', 'Tech jobs on GitHub'),
('We Work Remotely (Tech)', 'https://weworkremotely.com', 'remote', 'Technology', 'Remote Engineering, DevOps, Product, Design, Data, QA', 'Remote tech positions'),
('FlexJobs (Tech)', 'https://flexjobs.com', 'remote', 'Technology', 'Remote/Hybrid Engineering, IT, Data, Product', 'Remote and hybrid tech roles'),
('Upwork (Tech Freelance)', 'https://upwork.com', 'tech', 'Technology', 'Freelance Engineering, Web Development, Data, Cloud, QA, IT Support', 'Freelance tech and development work'),
('Blind', 'https://www.teamblind.com', 'tech', 'Technology', 'Software Engineering, Product, Design, Data', 'Tech company job board'),
('Dribbble Jobs', 'https://dribbble.com/jobs', 'tech', 'Technology', 'Designer, UX/UI, Product Design', 'Designer and creative tech roles'),
('The Muse', 'https://www.themuse.com/jobs', 'general', 'Technology', 'Tech, Product, Design, Marketing', 'Tech and creative jobs with company culture'),
('Crunchboard', 'https://crunchboard.com', 'tech', 'Technology', 'Engineering, Startup, Product', 'Tech and startup jobs'),
('Sentry Jobs', 'https://workboard.sentry.io/jobs', 'tech', 'Technology', 'Cloud, DevOps, Backend, Infrastructure', 'Cloud and DevOps roles')
ON CONFLICT (name) DO UPDATE SET 
  industry = EXCLUDED.industry,
  role_types = EXCLUDED.role_types,
  category = EXCLUDED.category,
  url = EXCLUDED.url,
  description = EXCLUDED.description;

-- CONSTRUCTION & SKILLED TRADES (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('ConstructionJobs.com', 'https://www.constructionjobs.com', 'niche', 'Construction', 'Dedicated construction job board'),
('iHireConstruction', 'https://www.ihireconstruction.com', 'niche', 'Construction', 'Construction and skilled trades jobs'),
('Roadtechs', 'https://www.roadtechs.com', 'niche', 'Construction', 'Road and highway construction jobs'),
('Tradesmen International', 'https://jobs.tradesmeninternational.com', 'niche', 'Construction', 'Skilled trades and union jobs')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- TRANSPORTATION & LOGISTICS (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('TruckersReport Jobs', 'https://www.thetruckersreport.com/jobs', 'niche', 'Transportation & Logistics', 'Truck driving and transportation jobs'),
('CDL Job Now', 'https://cdljobnow.com', 'niche', 'Transportation & Logistics', 'CDL and commercial driver jobs'),
('JobsInLogistics', 'https://www.jobsinlogistics.com', 'niche', 'Transportation & Logistics', 'Logistics and supply chain jobs'),
('FleetJobs', 'https://www.fleetjobs.com', 'niche', 'Transportation & Logistics', 'Fleet management and driving jobs')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- RETAIL & HOSPITALITY (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('HCareers', 'https://www.hcareers.com', 'niche', 'Retail & Hospitality', 'Hospitality and food service jobs'),
('Poached Jobs', 'https://poachedjobs.com', 'niche', 'Retail & Hospitality', 'Chef and culinary positions'),
('Culinary Agents', 'https://culinaryagents.com', 'niche', 'Retail & Hospitality', 'Executive chef and culinary jobs'),
('AllRetailJobs', 'https://www.allretailjobs.com', 'niche', 'Retail & Hospitality', 'Retail store and sales positions')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- CREATIVE & MEDIA (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('Behance Job Board', 'https://www.behance.net/joblist', 'niche', 'Creative & Media', 'Creative and design jobs'),
('Mediabistro', 'https://www.mediabistro.com', 'niche', 'Creative & Media', 'Media, publishing, and creative jobs'),
('Design Observer', 'https://designobserver.com/opportunities', 'niche', 'Creative & Media', 'Design and creative jobs'),
('ProBlogger', 'https://problogger.com', 'niche', 'Creative & Media', 'Blogging and content writing jobs')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- SCIENCE & BIOTECH (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('BioSpace', 'https://www.biospace.com/jobs', 'niche', 'Science & Biotech', 'Biotech and life sciences jobs'),
('Science Careers', 'https://jobs.sciencecareers.org', 'niche', 'Science & Biotech', 'Science and research positions'),
('Nature Careers', 'https://www.nature.com/naturecareers', 'niche', 'Science & Biotech', 'Scientific research jobs'),
('PharmiWeb', 'https://www.pharmiweb.jobs', 'niche', 'Science & Biotech', 'Pharmaceutical and biotech careers')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- EDUCATION (4 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('HigherEdJobs', 'https://www.higheredjobs.com', 'niche', 'Education', 'Higher education positions'),
('Chronicle Jobs', 'https://jobs.chronicle.com', 'niche', 'Education', 'Academic and university jobs'),
('K12JobSpot', 'https://www.k12jobspot.com', 'niche', 'Education', 'K-12 teaching positions'),
('TeachAway', 'https://www.teachaway.com', 'niche', 'Education', 'Teaching jobs worldwide')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- GOVERNMENT & PUBLIC SECTOR (3 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('USAJobs', 'https://www.usajobs.gov', 'general', 'Government', 'US federal government positions'),
('GovernmentJobs.com', 'https://www.governmentjobs.com', 'general', 'Government', 'State and local government jobs'),
('Careers in Government', 'https://www.careersingovernment.com', 'niche', 'Government', 'Public sector career opportunities')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- FINANCE & ACCOUNTING (3 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('eFinancialCareers', 'https://www.efinancialcareers.com', 'niche', 'Finance & Accounting', 'Finance and banking jobs'),
('AccountingJobsToday', 'https://www.accountingjobstoday.com', 'niche', 'Finance & Accounting', 'Accounting and CPA positions'),
('FinancialJobBank', 'https://www.financialjobbank.com', 'niche', 'Finance & Accounting', 'Financial services careers')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- LEGAL (3 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('LawCrossing', 'https://www.lawcrossing.com', 'niche', 'Legal', 'Legal and attorney positions'),
('NALP Jobs', 'https://jobs.nalp.org', 'niche', 'Legal', 'Law firm and legal careers'),
('LawJobs.com', 'https://www.lawjobs.com', 'niche', 'Legal', 'Dedicated legal job board')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- MANUFACTURING (3 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('ManufacturingJobs.com', 'https://www.manufacturingjobs.com', 'niche', 'Manufacturing', 'Manufacturing and industrial jobs'),
('iHireManufacturing', 'https://www.ihiremanufacturing.com', 'niche', 'Manufacturing', 'Factory and plant positions'),
('Engineering.com Jobs', 'https://www.engineering.com/jobs', 'niche', 'Manufacturing', 'Engineering and technical roles')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- REMOTE (CROSS-INDUSTRY) (3 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('RemoteOK', 'https://remoteok.com', 'remote', 'Remote', 'Fully remote positions across industries'),
('FlexJobs', 'https://www.flexjobs.com', 'remote', 'Remote', 'Flexible and remote job board (premium)'),
('Working Nomads', 'https://www.workingnomads.com', 'remote', 'Remote', 'Jobs for digital nomads and remote workers')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- GENERAL/MAINSTREAM (10 boards)
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('LinkedIn', 'https://linkedin.com/jobs', 'general', 'General', 'Professional network job listings'),
('Indeed', 'https://www.indeed.com', 'general', 'General', 'Largest general job board'),
('Glassdoor', 'https://www.glassdoor.com', 'general', 'General', 'Job board with company reviews and salaries'),
('ZipRecruiter', 'https://www.ziprecruiter.com', 'general', 'General', 'AI-powered job matching platform'),
('Monster', 'https://www.monster.com', 'general', 'General', 'Legacy job board with global reach'),
('CareerBuilder', 'https://www.careerbuilder.com', 'general', 'General', 'Established job board with resume database'),
('Snagajob', 'https://www.snagajob.com', 'general', 'General', 'Hourly and part-time jobs'),
('Craigslist', 'https://craigslist.org/search/jjj', 'general', 'General', 'Craigslist jobs section'),
('Idealist.org', 'https://www.idealist.org', 'niche', 'General', 'Non-profit and social impact jobs'),
('EnvironmentalCareer.com', 'https://www.environmentalcareer.com', 'niche', 'General', 'Environmental and sustainability jobs')
ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT COUNT(*) as total_boards FROM job_boards;

SELECT industry, COUNT(*) as board_count 
FROM job_boards 
WHERE industry IS NOT NULL 
GROUP BY industry 
ORDER BY board_count DESC;
