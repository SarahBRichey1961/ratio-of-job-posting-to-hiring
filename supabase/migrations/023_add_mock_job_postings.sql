-- Add mock job postings for testing the job scraper UI
-- These test entries are for today's date (2026-02-24)

INSERT INTO job_postings (
  board_id,
  board_name,
  job_title,
  job_url,
  company_name,
  posted_date,
  posted_at,
  scraped_at
) VALUES
  -- Stack Overflow Jobs (ID: 1)
  (1, 'Stack Overflow Jobs', 'Senior Full-Stack Engineer', 'https://stackoverflow.com/jobs/1001', 'TechCorp Inc', '2026-02-24', NOW(), NOW()),
  (1, 'Stack Overflow Jobs', 'Product Manager - Cloud Platform', 'https://stackoverflow.com/jobs/1002', 'CloudSys LLC', '2026-02-24', NOW(), NOW()),
  (1, 'Stack Overflow Jobs', 'DevOps Engineer', 'https://stackoverflow.com/jobs/1003', 'ScaleUp Technologies', '2026-02-24', NOW(), NOW()),
  (1, 'Stack Overflow Jobs', 'Data Scientist - ML', 'https://stackoverflow.com/jobs/1004', 'AI Innovations', '2026-02-24', NOW(), NOW()),
  
  -- Indeed (ID: 2)
  (2, 'Indeed', 'Software Engineer II', 'https://indeed.com/viewjob?jk=2001', 'Enterprise Solutions', '2026-02-24', NOW(), NOW()),
  (2, 'Indeed', 'Senior Backend Developer', 'https://indeed.com/viewjob?jk=2002', 'Digital Ventures', '2026-02-24', NOW(), NOW()),
  (2, 'Indeed', 'QA Automation Engineer', 'https://indeed.com/viewjob?jk=2003', 'Quality First Corp', '2026-02-24', NOW(), NOW()),
  
  -- LinkedIn (ID: 3)
  (3, 'LinkedIn', 'Principal Engineer', 'https://linkedin.com/jobs/view/3001', 'Enterprise Tech', '2026-02-24', NOW(), NOW()),
  (3, 'LinkedIn', 'Engineering Manager', 'https://linkedin.com/jobs/view/3002', 'Tech Leaders Inc', '2026-02-24', NOW(), NOW()),
  
  -- GitHub Jobs (ID: 4)
  (4, 'GitHub Jobs', 'Open Source Contributions Lead', 'https://github.com/jobs/4001', 'Open Source Foundation', '2026-02-24', NOW(), NOW()),
  
  -- Built In (ID: 6)
  (6, 'Built In', 'Engineering Manager - Startup', 'https://builtin.com/jobs/6001', 'StartUp Labs', '2026-02-24', NOW(), NOW()),
  (6, 'Built In', 'Full Stack Developer', 'https://builtin.com/jobs/6002', 'Tech Startup Co', '2026-02-24', NOW(), NOW()),
  
  -- FlexJobs (ID: 71)
  (71, 'FlexJobs', 'Remote Full-Time Developer', 'https://flexjobs.com/jobs/71001', 'Remote First Company', '2026-02-24', NOW(), NOW()),
  (71, 'FlexJobs', 'Contract UX/UI Designer', 'https://flexjobs.com/jobs/71002', 'Design House', '2026-02-24', NOW(), NOW()),
  (71, 'FlexJobs', 'Freelance Content Writer', 'https://flexjobs.com/jobs/71003', 'Content Agency', '2026-02-24', NOW(), NOW());

-- Add a few entries from yesterday for testing historical data
INSERT INTO job_postings (
  board_id,
  board_name,
  job_title,
  job_url,
  company_name,
  posted_date,
  posted_at,
  scraped_at
) VALUES
  (1, 'Stack Overflow Jobs', 'Frontend Engineer - React', 'https://stackoverflow.com/jobs/1010', 'Web First Co', '2026-02-23', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (2, 'Indeed', 'Solutions Architect', 'https://indeed.com/viewjob?jk=2010', 'Enterprise Solutions', '2026-02-23', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (71, 'FlexJobs', 'Virtual Assistant', 'https://flexjobs.com/jobs/71010', 'Admin Solutions', '2026-02-23', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Verify insertion
SELECT board_name, COUNT(*) as job_count, MAX(posted_date) as latest_date 
FROM job_postings 
WHERE posted_date >= '2026-02-23'
GROUP BY board_name 
ORDER BY board_name;
