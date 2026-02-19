-- Day 3: Seed Job Boards
-- Insert 30+ major US job boards with categories

INSERT INTO job_boards (name, url, category, description) VALUES
-- General Job Boards
('Indeed', 'https://www.indeed.com', 'general', 'Largest job board with 250M+ monthly visitors'),
('LinkedIn Jobs', 'https://www.linkedin.com/jobs', 'general', 'Professional network job listings'),
('ZipRecruiter', 'https://www.ziprecruiter.com', 'general', 'AI-powered job matching platform'),
('Glassdoor', 'https://www.glassdoor.com', 'general', 'Job board with company reviews and salaries'),
('CareerBuilder', 'https://www.careerbuilder.com', 'general', 'Established job board with resume database'),
('Monster', 'https://www.monster.com', 'general', 'Legacy job board with global reach'),
('FlexJobs', 'https://www.flexjobs.com', 'general', 'Job board focused on flexible and remote work'),

-- Tech-Focused Job Boards
('Stack Overflow', 'https://stackoverflow.com/jobs', 'tech', 'Developer-focused job board'),
('GitHub Jobs', 'https://jobs.github.com', 'tech', 'Tech jobs from GitHub community'),
('AngelList', 'https://angel.co/jobs', 'tech', 'Startup job board'),
('We Work Remotely', 'https://weworkremotely.com', 'tech', 'Remote tech jobs'),
('Dribbble Jobs', 'https://dribbble.com/jobs', 'tech', 'Designer and creative tech jobs'),
('Crunchboard', 'https://crunchboard.com', 'tech', 'Tech and startup jobs'),
('The Muse', 'https://www.themuse.com', 'tech', 'Tech and creative jobs with company culture focus'),
('Hired', 'https://hired.com', 'tech', 'Invite-only tech job board'),
('Blind', 'https://www.teamblind.com', 'tech', 'Tech company job board with anonymous reviews'),
('Dice', 'https://www.dice.com', 'tech', 'Tech and engineering jobs'),

-- Remote-Focused Job Boards
('RemoteOK', 'https://remoteok.io', 'remote', 'Remote job board with 75,000+ jobs'),
('Working Nomads', 'https://www.workingnomads.co', 'remote', 'Remote jobs for digital nomads'),
('Remotive', 'https://remotive.io', 'remote', 'Curated remote job board'),
('Remote.co', 'https://remote.co', 'remote', 'Remote job board with quality curation'),
('Teleport', 'https://teleport.org/remotely', 'teleport', 'Remote job board with relocation info'),
('Virtual Vocations', 'https://www.virtualvocations.com', 'remote', 'Vetted remote jobs database'),

-- Niche Job Boards
('Idealist.org', 'https://www.idealist.org', 'niche', 'Non-profit and social impact jobs'),
('EnvironmentalCareer.com', 'https://www.environmentalcareer.com', 'niche', 'Environmental and sustainability jobs'),
('Proofreads', 'https://www.proofreads.com', 'niche', 'Writing and editorial jobs'),
('ProBlogger', 'https://problogger.com', 'niche', 'Blogging and content writing jobs'),
('Mediabistro', 'https://www.mediabistro.com', 'niche', 'Media, publishing, and creative jobs'),
('Design Observer', 'https://designobserver.com/opportunities', 'niche', 'Design and creative jobs'),
('EduJobs', 'https://www.edujobs.org', 'niche', 'Education and academic jobs'),
('Healthcare Jobsite', 'https://www.healthcarejobsite.com', 'niche', 'Healthcare and nursing jobs'),
('Culinary Agents', 'https://www.theculinaryagents.com', 'niche', 'Culinary and hospitality jobs'),
('Aviation Job Search', 'https://www.aviationjobsearch.com', 'niche', 'Aviation and aerospace jobs'),
('Legal Boards', 'https://legalboards.com', 'niche', 'Legal and law firm jobs'),
('Behance Jobs', 'https://www.behance.net', 'niche', 'Creative and design portfolio jobs')
ON CONFLICT (name) DO NOTHING;

-- Verify insert
SELECT COUNT(*) as total_boards FROM job_boards;
