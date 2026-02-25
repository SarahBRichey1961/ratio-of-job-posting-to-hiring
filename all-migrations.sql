-- ALL MIGRATIONS IN ONE FILE
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- INITIAL SCHEMA (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS job_boards (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(500) NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_boards_name ON job_boards(name);
CREATE INDEX IF NOT EXISTS idx_job_boards_category ON job_boards(category);

CREATE TABLE IF NOT EXISTS job_postings (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT REFERENCES job_boards(id) ON DELETE CASCADE,
  title VARCHAR(255),
  company VARCHAR(255),
  location VARCHAR(255),
  url VARCHAR(500),
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_board ON job_postings(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_at ON job_postings(posted_at);

CREATE TABLE IF NOT EXISTS posting_events (
  id BIGSERIAL PRIMARY KEY,
  posting_id BIGINT REFERENCES job_postings(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employer_surveys (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT REFERENCES job_boards(id) ON DELETE CASCADE,
  hiring_difficulty VARCHAR(50),
  candidate_quality VARCHAR(50),
  cost_effectiveness VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_surveys (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT REFERENCES job_boards(id) ON DELETE CASCADE,
  user_experience VARCHAR(50),
  job_relevance VARCHAR(50),
  application_ease VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS efficiency_scores (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT REFERENCES job_boards(id) ON DELETE CASCADE,
  score FLOAT,
  metric_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MIGRATION 017: Add industry & roles
-- ============================================

ALTER TABLE job_boards 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'General';

CREATE INDEX IF NOT EXISTS idx_job_boards_industry ON job_boards(industry);

CREATE TABLE IF NOT EXISTS job_roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_roles_name ON job_roles(name);

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

-- ============================================
-- MIGRATION 018: Seed 44 job boards
-- ============================================

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

-- ============================================
-- VERIFICATION
-- ============================================

SELECT COUNT(*) as total_boards FROM job_boards;
SELECT COUNT(*) as total_roles FROM job_roles;
SELECT DISTINCT industry FROM job_boards ORDER BY industry;
