-- ============================================================================
-- COMBINED MIGRATION: Load 15 Tech Boards + All Roles + Role-Board Links
-- ============================================================================
-- Execute this entire script in Supabase SQL Editor to:
-- 1. Add role_types column to job_boards
-- 2. Add 15 specialized tech boards (Built In, Dice, TechFetch, etc.)
-- 3. Add 19 new job roles (Backend, Frontend, Full-Stack, etc.)
-- 4. Link all boards to their appropriate roles
-- ============================================================================

-- ============================================================================
-- STEP 0: Create job_board_roles junction table (from migration 017)
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_board_roles (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, job_role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_board_roles_board_id ON job_board_roles(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_board_roles_role_id ON job_board_roles(job_role_id);

-- ============================================================================
-- STEP 1: Add role_types column
-- ============================================================================
ALTER TABLE job_boards
ADD COLUMN IF NOT EXISTS role_types TEXT;

-- Create index for role_types searches
CREATE INDEX IF NOT EXISTS idx_job_boards_role_types ON job_boards USING GIN(to_tsvector('english', role_types));

-- ============================================================================
-- STEP 2: Add 15 specialized tech boards
-- ============================================================================
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

-- ============================================================================
-- STEP 3: Add new job roles (if they don't exist)
-- ============================================================================
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

-- ============================================================================
-- STEP 4: Link boards to their available roles
-- ============================================================================

-- Built In
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Built In'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'Product Manager', 'Designer', 'DevOps Engineer')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Dice
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Dice'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Data Scientist', 'Cybersecurity', 'AI/ML', 'Cloud Engineering', 'IT Operations', 'IT Support')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- LinkedIn (Tech)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'LinkedIn (Tech)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Cloud Engineering', 'Cybersecurity', 'Engineering Leadership')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Indeed (Tech)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Indeed (Tech)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'IT Support', 'QA', 'Data Scientist', 'Product Manager', 'Cloud Engineering')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Glassdoor (Tech)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Glassdoor (Tech)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'IT Support', 'Cybersecurity', 'Product Manager')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- TechFetch
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'TechFetch'
AND jr.name IN ('IT Consulting', 'Frontend Developer', 'Backend Developer', 'Systems Engineering', 'Enterprise Tech', 'Cloud Engineering')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Stack Overflow Jobs
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Stack Overflow Jobs'
AND jr.name IN ('Backend', 'Frontend', 'Full-Stack', 'DevOps Engineer', 'Cloud Engineering', 'QA', 'Engineering Leadership')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- AngelList Talent
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'AngelList Talent'
AND jr.name IN ('Startup Engineering', 'Product Manager', 'Designer', 'Data Scientist', 'Founding Engineer', 'CTO')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Hired
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Hired'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Cloud Engineering', 'Product Manager', 'Engineering Leadership')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- CrunchBoard (TechCrunch)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'CrunchBoard (TechCrunch)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Engineering Leadership', 'Product Manager', 'Designer', 'IT Support', 'DevOps Engineer')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Remote Tech Jobs
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Remote Tech Jobs'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'DevOps Engineer', 'Cloud Engineering', 'Data Scientist', 'QA', 'Cybersecurity')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- GitHub Jobs
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'GitHub Jobs'
AND jr.name IN ('Open-Source Engineering', 'Backend', 'Frontend', 'DevOps Engineer', 'Cloud Engineering')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- We Work Remotely (Tech)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'We Work Remotely (Tech)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'DevOps Engineer', 'Cloud Engineering', 'Product Manager', 'Designer', 'Data Scientist', 'QA')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- FlexJobs (Tech)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'FlexJobs (Tech)'
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'IT Support', 'Data Scientist', 'Product Manager', 'Cloud Engineering')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Upwork (Tech Freelance)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name = 'Upwork (Tech Freelance)'
AND jr.name IN ('Freelance Engineering', 'Web Development', 'Frontend Developer', 'Backend Developer', 'Data Scientist', 'Cloud Engineering', 'QA', 'IT Support')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- ============================================================================
-- DONE! Run this entire script in Supabase to load all boards and roles
-- ============================================================================
