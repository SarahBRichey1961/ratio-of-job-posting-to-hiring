-- Execute all pending migrations 021 and 022
-- Run this in Supabase SQL Editor

-- ===== MIGRATION 021: Add 15 specialized tech boards =====
-- 1. Add role_types column to job_boards if it doesn't exist
ALTER TABLE job_boards
ADD COLUMN IF NOT EXISTS role_types TEXT;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_job_boards_role_types ON job_boards USING GIN(to_tsvector('english', role_types));

-- 2. Insert 15 specialized tech boards
INSERT INTO job_boards (name, url, category, industry, role_types, description) VALUES
('Built In', 'https://builtin.com', 'tech', 'Technology', 'Software Engineering, Data Science, Product Management, UX/UI, DevOps, Startup Tech', 'Tech jobs with company insights and profiles'),
('Dice', 'https://dice.com', 'tech', 'Technology', 'Software Engineering, Data Science, Cybersecurity, AI/ML, Cloud Engineering, IT Operations', 'IT and tech professional job board'),
('LinkedIn (Tech)', 'https://linkedin.com/jobs', 'general', 'Technology', 'Software Engineering, IT, Data, Cloud, Cybersecurity, Product, Leadership', 'Tech roles on LinkedIn Jobs platform'),
('Indeed (Tech)', 'https://indeed.com', 'general', 'Technology', 'Software Engineering, IT Support, QA, Data, Product, Cloud', 'Tech positions on Indeed platform'),
('Glassdoor (Tech)', 'https://glassdoor.com', 'general', 'Technology', 'Software Engineering, IT, Data, Cybersecurity, Product', 'Tech jobs on Glassdoor platform'),
('TechFetch', 'https://techfetch.com', 'tech', 'Technology', 'IT Consulting, Software Development, Systems Engineering, Enterprise Tech', 'Enterprise and IT consulting tech jobs'),
('Stack Overflow Jobs', 'https://stackoverflow.com/jobs', 'tech', 'Technology', 'Backend, Frontend, Full-Stack, DevOps, Cloud, QA, Engineering Leadership', 'Developer jobs on Stack Overflow'),
('AngelList Talent', 'https://angel.co/jobs', 'tech', 'Technology', 'Startup Engineering, Product, Design, Data, Founding Engineer, CTO', 'Startup and tech founder roles'),
('Hired', 'https://hired.com', 'tech', 'Technology', 'Software Engineering, Data Science, DevOps, Cloud, Product, Engineering Management', 'Reverse recruitment for tech talent'),
('CrunchBoard (TechCrunch)', 'https://jobs.techcrunch.com', 'tech', 'Technology', 'Engineering, Product, Design, IT, Startup Tech', 'Tech and startup jobs from TechCrunch'),
('Remote Tech Jobs', 'https://remotetechjobs.com', 'remote', 'Technology', 'Remote Engineering, DevOps, Cloud, Data, QA, Cybersecurity', 'Remote-first tech job board'),
('GitHub Jobs', 'https://jobs.github.com', 'tech', 'Technology', 'Open-Source Engineering, Backend, Frontend, DevOps', 'Open-source and developer roles'),
('We Work Remotely (Tech)', 'https://weworkremotely.com', 'remote', 'Technology', 'Remote Engineering, DevOps, Product, Design, Data, QA', 'Remote tech positions'),
('FlexJobs (Tech)', 'https://flexjobs.com', 'remote', 'Technology', 'Remote/Hybrid Engineering, IT, Data, Product', 'Remote and hybrid tech roles'),
('Upwork (Tech Freelance)', 'https://upwork.com', 'tech', 'Technology', 'Freelance Engineering, Web Development, Data, Cloud, QA, IT Support', 'Freelance tech and development work')
ON CONFLICT (name) DO NOTHING;

-- ===== MIGRATION 022: Map tech board role types to job_board_roles =====
-- 1. Add new role types that don't exist in job_roles yet
INSERT INTO job_roles (name, description) VALUES
('Startup Engineering', 'Early-stage startup engineering roles'),
('Founding Engineer', 'Founding engineer positions'),
('CTO', 'Chief Technology Officer roles'),
('Engineering Leadership', 'Engineering management and leadership'),
('Backend', 'Backend development roles'),
('Frontend', 'Frontend/UI development roles'),
('Full-Stack', 'Full-stack development roles'),
('Cloud Engineering', 'Cloud infrastructure and engineering'),
('IT Consulting', 'IT consulting and strategy roles'),
('Systems Engineering', 'Systems and infrastructure engineering'),
('Enterprise Tech', 'Enterprise software and technology roles'),
('Open-Source Engineering', 'Open-source development roles'),
('IT Support', 'IT support and help desk roles'),
('QA', 'Quality assurance and testing roles'),
('Cybersecurity', 'Cybersecurity and information security roles'),
('AI/ML', 'Artificial Intelligence and Machine Learning roles'),
('IT Operations', 'IT operations and infrastructure roles'),
('Web Development', 'Web development and web applications'),
('Freelance Engineering', 'Freelance and contract engineering work')
ON CONFLICT (name) DO NOTHING;

-- 2. Link specific boards to their roles via job_board_roles
-- Built In
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Built In'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'Product Manager', 'Designer', 'DevOps Engineer', 'Startup Tech')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Dice
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Dice'
AND jr.name IN ('Software Engineering', 'Data Scientist', 'Cybersecurity', 'AI/ML', 'Cloud Engineering', 'IT Operations', 'IT Support')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Continue with remaining boards...
