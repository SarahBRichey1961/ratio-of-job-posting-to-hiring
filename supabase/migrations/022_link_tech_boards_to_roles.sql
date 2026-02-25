-- Migration: Map tech board role types to job_board_roles
-- Purpose: Link specialized tech boards to their available roles

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
