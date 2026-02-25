-- Migration: Assign industries to the original 36 boards
-- Maps category to appropriate industry for all original boards

UPDATE job_boards SET industry = 'General' 
WHERE name IN ('Indeed', 'LinkedIn Jobs', 'ZipRecruiter', 'Glassdoor', 'CareerBuilder', 'Monster', 'FlexJobs')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Technology' 
WHERE name IN ('Stack Overflow', 'GitHub Jobs', 'AngelList', 'We Work Remotely', 'Dribbble Jobs', 'Crunchboard', 'The Muse', 'Hired', 'Blind', 'Dice')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Remote' 
WHERE name IN ('RemoteOK', 'Working Nomads', 'Remotive', 'Remote.co', 'Teleport', 'Virtual Vocations')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Creative & Media' 
WHERE name IN ('Design Observer', 'Mediabistro', 'ProBlogger', 'Proofreads')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Education' 
WHERE name IN ('EduJobs')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Healthcare' 
WHERE name IN ('Healthcare Jobsite')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Retail & Hospitality' 
WHERE name IN ('Culinary Agents')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Transportation & Logistics' 
WHERE name IN ('Aviation Job Search')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Legal' 
WHERE name IN ('Legal Boards')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Science & Biotech' 
WHERE name IN ('Behance Jobs')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Government' 
WHERE name IN ('Idealist.org')
AND industry IS NULL;

UPDATE job_boards SET industry = 'Construction' 
WHERE name IN ('EnvironmentalCareer.com')
AND industry IS NULL;

-- Verify all boards have industries
SELECT COUNT(*) as total_boards, COUNT(industry) as with_industry, COUNT(CASE WHEN industry IS NULL THEN 1 END) as without_industry 
FROM job_boards;
