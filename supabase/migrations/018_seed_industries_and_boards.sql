-- Migration: Seed all industries and job boards
-- 12 industries with 55+ curated job boards

-- 1. Technology Industry
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('Dice', 'https://www.dice.com', 'tech', 'Technology', 'Tech-focused job board for IT and software roles'),
('Stack Overflow Jobs', 'https://stackoverflow.com/jobs', 'tech', 'Technology', 'Developer jobs on Stack Overflow platform'),
('Built In', 'https://builtin.com/jobs', 'tech', 'Technology', 'Tech jobs with company insights'),
('AngelList Talent', 'https://angel.co/jobs', 'tech', 'Technology', 'Startup and tech jobs on AngelList'),
('Hired', 'https://hired.com', 'tech', 'Technology', 'Reverse recruitment for tech professionals')
ON CONFLICT (name) DO NOTHING;

-- 2. Construction & Skilled Trades
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('ConstructionJobs.com', 'https://www.constructionjobs.com', 'niche', 'Construction', 'Dedicated construction job board'),
('iHireConstruction', 'https://www.ihireconstruction.com', 'niche', 'Construction', 'Construction and skilled trades jobs'),
('Roadtechs', 'https://www.roadtechs.com', 'niche', 'Construction', 'Road and highway construction jobs'),
('Tradesmen International', 'https://jobs.tradesmeninternational.com', 'niche', 'Construction', 'Skilled trades and union jobs')
ON CONFLICT (name) DO NOTHING;

-- 3. Transportation & Logistics
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('TruckersReport Jobs', 'https://www.thetruckersreport.com/jobs', 'niche', 'Transportation & Logistics', 'Truck driving and transportation jobs'),
('CDL Job Now', 'https://cdljobnow.com', 'niche', 'Transportation & Logistics', 'CDL and commercial driver jobs'),
('JobsInLogistics', 'https://www.jobsinlogistics.com', 'niche', 'Transportation & Logistics', 'Logistics and supply chain jobs'),
('FleetJobs', 'https://www.fleetjobs.com', 'niche', 'Transportation & Logistics', 'Fleet management and driving jobs')
ON CONFLICT (name) DO NOTHING;

-- 4. Retail & Hospitality
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('HCareers', 'https://www.hcareers.com', 'niche', 'Retail & Hospitality', 'Hospitality and food service jobs'),
('Poached Jobs', 'https://poachedjobs.com', 'niche', 'Retail & Hospitality', 'Chef and culinary positions'),
('Culinary Agents', 'https://culinaryagents.com', 'niche', 'Retail & Hospitality', 'Executive chef and culinary jobs'),
('AllRetailJobs', 'https://www.allretailjobs.com', 'niche', 'Retail & Hospitality', 'Retail store and sales positions')
ON CONFLICT (name) DO NOTHING;

-- 5. Creative, Media & Marketing
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('Behance Job Board', 'https://www.behance.net/joblist', 'niche', 'Creative & Media', 'Creative and design jobs'),
('Dribbble Jobs', 'https://dribbble.com/jobs', 'niche', 'Creative & Media', 'Designer and creative roles'),
('We Work Remotely', 'https://weworkremotely.com', 'remote', 'Creative & Media', 'Remote creative jobs'),
('The Muse', 'https://www.themuse.com/jobs', 'general', 'Creative & Media', 'Career discovery with creative positions')
ON CONFLICT (name) DO NOTHING;

-- 6. Science, Research & Biotech
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('BioSpace', 'https://www.biospace.com/jobs', 'niche', 'Science & Biotech', 'Biotech and life sciences jobs'),
('Science Careers', 'https://jobs.sciencecareers.org', 'niche', 'Science & Biotech', 'Science and research positions'),
('Nature Careers', 'https://www.nature.com/naturecareers', 'niche', 'Science & Biotech', 'Scientific research jobs'),
('PharmiWeb', 'https://www.pharmiweb.jobs', 'niche', 'Science & Biotech', 'Pharmaceutical and biotech careers')
ON CONFLICT (name) DO NOTHING;

-- 7. Education
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('HigherEdJobs', 'https://www.higheredjobs.com', 'niche', 'Education', 'Higher education positions'),
('Chronicle Jobs', 'https://jobs.chronicle.com', 'niche', 'Education', 'Academic and university jobs'),
('K12JobSpot', 'https://www.k12jobspot.com', 'niche', 'Education', 'K-12 teaching positions'),
('TeachAway', 'https://www.teachaway.com', 'niche', 'Education', 'Teaching jobs worldwide')
ON CONFLICT (name) DO NOTHING;

-- 8. Government & Public Sector
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('USAJobs', 'https://www.usajobs.gov', 'general', 'Government', 'US federal government positions'),
('GovernmentJobs.com', 'https://www.governmentjobs.com', 'general', 'Government', 'State and local government jobs'),
('Careers in Government', 'https://www.careersingovernment.com', 'niche', 'Government', 'Public sector career opportunities')
ON CONFLICT (name) DO NOTHING;

-- 9. Finance & Accounting
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('eFinancialCareers', 'https://www.efinancialcareers.com', 'niche', 'Finance & Accounting', 'Finance and banking jobs'),
('AccountingJobsToday', 'https://www.accountingjobstoday.com', 'niche', 'Finance & Accounting', 'Accounting and CPA positions'),
('FinancialJobBank', 'https://www.financialjobbank.com', 'niche', 'Finance & Accounting', 'Financial services careers')
ON CONFLICT (name) DO NOTHING;

-- 10. Legal
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('LawCrossing', 'https://www.lawcrossing.com', 'niche', 'Legal', 'Legal and attorney positions'),
('NALP Jobs', 'https://jobs.nalp.org', 'niche', 'Legal', 'Law firm and legal careers'),
('LawJobs.com', 'https://www.lawjobs.com', 'niche', 'Legal', 'Dedicated legal job board')
ON CONFLICT (name) DO NOTHING;

-- 11. Manufacturing & Industrial
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('ManufacturingJobs.com', 'https://www.manufacturingjobs.com', 'niche', 'Manufacturing', 'Manufacturing and industrial jobs'),
('iHireManufacturing', 'https://www.ihiremanufacturing.com', 'niche', 'Manufacturing', 'Factory and plant positions'),
('Engineering.com Jobs', 'https://www.engineering.com/jobs', 'niche', 'Manufacturing', 'Engineering and technical roles')
ON CONFLICT (name) DO NOTHING;

-- 12. Remote-Only (Cross-Industry) - Key for monetization
INSERT INTO job_boards (name, url, category, industry, description) VALUES
('RemoteOK', 'https://remoteok.com', 'remote', 'Remote', 'Fully remote positions across industries'),
('FlexJobs', 'https://www.flexjobs.com', 'remote', 'Remote', 'Flexible and remote job board (premium)'),
('Working Nomads', 'https://www.workingnomads.com', 'remote', 'Remote', 'Jobs for digital nomads and remote workers')
ON CONFLICT (name) DO NOTHING;

-- Also add the original boards if they weren't in above
INSERT INTO job_boards (name, url, category, industry, description) VALUES
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
