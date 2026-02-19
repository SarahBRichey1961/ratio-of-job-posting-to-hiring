-- ====================================================================
-- COMPLETE DATABASE SCHEMA - ALL 13 MIGRATIONS COMBINED
-- Run this entire script in Supabase SQL Editor
-- ====================================================================

-- ==================================================================
-- MIGRATION 001: Initial Schema
-- ==================================================================

CREATE TABLE IF NOT EXISTS job_boards (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_postings (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  normalized_title VARCHAR(255),
  company VARCHAR(255),
  description TEXT,
  url VARCHAR(500) UNIQUE,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disappeared BOOLEAN DEFAULT FALSE,
  disappeared_at TIMESTAMP WITH TIME ZONE,
  lifespan_days INT,
  repost_count INT DEFAULT 0,
  repost_cluster_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posting_events (
  id BIGSERIAL PRIMARY KEY,
  job_posting_id BIGINT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS efficiency_scores (
  id BIGSERIAL PRIMARY KEY,
  job_board_id INTEGER NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  lifespan_score INTEGER NOT NULL CHECK (lifespan_score >= 0 AND lifespan_score <= 100),
  repost_score INTEGER NOT NULL CHECK (repost_score >= 0 AND repost_score <= 100),
  employer_survey_score INTEGER DEFAULT 50 CHECK (employer_survey_score >= 0 AND employer_survey_score <= 100),
  candidate_survey_score INTEGER DEFAULT 50 CHECK (candidate_survey_score >= 0 AND candidate_survey_score <= 100),
  quality_adjustment DECIMAL(3,2) DEFAULT 1.0,
  data_completeness DECIMAL(3,2) DEFAULT 0.5,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, computed_at)
);

CREATE INDEX IF NOT EXISTS idx_job_postings_board_id ON job_postings(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_first_seen ON job_postings(first_seen);
CREATE INDEX IF NOT EXISTS idx_job_postings_last_seen ON job_postings(last_seen);
CREATE INDEX IF NOT EXISTS idx_posting_events_posting_id ON posting_events(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_posting_events_event_date ON posting_events(event_date);
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_board_id ON efficiency_scores(job_board_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_overall ON efficiency_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_computed_at ON efficiency_scores(computed_at DESC);

-- ==================================================================
-- MIGRATION 002: Seed Job Boards
-- ==================================================================

INSERT INTO job_boards (name, url, category, description) VALUES
('Indeed', 'https://www.indeed.com', 'general', 'Largest job board with 250M+ monthly visitors'),
('LinkedIn Jobs', 'https://www.linkedin.com/jobs', 'general', 'Professional network job listings'),
('ZipRecruiter', 'https://www.ziprecruiter.com', 'general', 'AI-powered job matching platform'),
('Glassdoor', 'https://www.glassdoor.com', 'general', 'Job board with company reviews and salaries'),
('CareerBuilder', 'https://www.careerbuilder.com', 'general', 'Established job board with resume database'),
('Monster', 'https://www.monster.com', 'general', 'Legacy job board with global reach'),
('FlexJobs', 'https://www.flexjobs.com', 'general', 'Job board focused on flexible and remote work'),
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
('RemoteOK', 'https://remoteok.io', 'remote', 'Remote job board with 75,000+ jobs'),
('Working Nomads', 'https://www.workingnomads.co', 'remote', 'Remote jobs for digital nomads'),
('Remotive', 'https://remotive.io', 'remote', 'Curated remote job board'),
('Remote.co', 'https://remote.co', 'remote', 'Remote job board with quality curation'),
('Teleport', 'https://teleport.org/remotely', 'remote', 'Remote job board with relocation info'),
('Virtual Vocations', 'https://www.virtualvocations.com', 'remote', 'Vetted remote jobs database'),
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

-- ==================================================================
-- MIGRATION 003-006: Views and Metrics
-- ==================================================================

CREATE OR REPLACE VIEW active_postings AS
SELECT
  jp.id,
  jp.job_board_id,
  jp.title,
  jp.normalized_title,
  jp.company,
  jp.first_seen,
  jp.last_seen,
  jp.lifespan_days,
  jb.name as board_name
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.disappeared = FALSE
ORDER BY jp.last_seen DESC;

CREATE OR REPLACE VIEW disappeared_postings AS
SELECT
  jp.id,
  jp.job_board_id,
  jp.title,
  jp.normalized_title,
  jp.company,
  jp.first_seen,
  jp.disappeared_at,
  jp.lifespan_days,
  jb.name as board_name
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.disappeared = TRUE
ORDER BY jp.disappeared_at DESC;

CREATE OR REPLACE VIEW lifespan_stats_by_board AS
SELECT
  jb.id,
  jb.name,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.disappeared = FALSE THEN 1 END) as active_postings,
  COUNT(CASE WHEN jp.disappeared = TRUE THEN 1 END) as disappeared_postings,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan_days,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jp.lifespan_days) as median_lifespan_days,
  MIN(jp.lifespan_days) as min_lifespan_days,
  MAX(jp.lifespan_days) as max_lifespan_days
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

CREATE OR REPLACE VIEW lifespan_stats_by_role AS
SELECT
  jp.normalized_title as role_family,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.disappeared = FALSE THEN 1 END) as active_postings,
  COUNT(CASE WHEN jp.disappeared = TRUE THEN 1 END) as disappeared_postings,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan_days,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jp.lifespan_days) as median_lifespan_days
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title
ORDER BY avg_lifespan_days DESC;

CREATE OR REPLACE VIEW posting_timeline AS
SELECT
  pe.job_posting_id,
  jp.title,
  jp.company,
  jb.name as board_name,
  pe.event_type,
  pe.event_date,
  ROW_NUMBER() OVER (PARTITION BY pe.job_posting_id ORDER BY pe.event_date) as event_sequence
FROM posting_events pe
JOIN job_postings jp ON pe.job_posting_id = jp.id
JOIN job_boards jb ON jp.job_board_id = jb.id
ORDER BY pe.job_posting_id, pe.event_date;

CREATE INDEX IF NOT EXISTS idx_postings_lifespan_days ON job_postings(lifespan_days);
CREATE INDEX IF NOT EXISTS idx_postings_disappeared ON job_postings(disappeared);
CREATE INDEX IF NOT EXISTS idx_postings_role_family ON job_postings(normalized_title);
CREATE INDEX IF NOT EXISTS idx_posting_events_type ON posting_events(event_type);

-- ==================================================================
-- MIGRATION 004: Pipeline Infrastructure
-- ==================================================================

CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL,
  job_board_id INTEGER REFERENCES job_boards(id),
  board_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_board_id INTEGER NOT NULL REFERENCES job_boards(id),
  board_name VARCHAR(255) NOT NULL,
  snapshot_date TIMESTAMP NOT NULL,
  posting_count INTEGER DEFAULT 0,
  new_postings INTEGER DEFAULT 0,
  active_postings INTEGER DEFAULT 0,
  disappeared_postings INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  jobs JSONB[],
  errors TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_board ON pipeline_jobs(job_board_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created ON pipeline_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_board ON raw_data_snapshots(job_board_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON raw_data_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_board_date ON raw_data_snapshots(job_board_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_start ON pipeline_runs(start_time);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_run_id ON pipeline_runs(run_id);

-- ==================================================================
-- MIGRATION 007: Scoring Algorithm
-- ==================================================================

CREATE OR REPLACE VIEW current_board_scores AS
SELECT
  jb.id,
  jb.name,
  es.overall_score,
  es.lifespan_score,
  es.repost_score,
  es.employer_survey_score,
  es.candidate_survey_score,
  es.quality_adjustment,
  es.data_completeness,
  es.computed_at,
  CASE
    WHEN es.overall_score >= 90 THEN 'A+'
    WHEN es.overall_score >= 85 THEN 'A'
    WHEN es.overall_score >= 80 THEN 'B+'
    WHEN es.overall_score >= 75 THEN 'B'
    WHEN es.overall_score >= 70 THEN 'C+'
    WHEN es.overall_score >= 60 THEN 'C'
    WHEN es.overall_score >= 50 THEN 'D'
    ELSE 'F'
  END as grade
FROM job_boards jb
LEFT JOIN LATERAL (
  SELECT * FROM efficiency_scores WHERE job_board_id = jb.id
  ORDER BY computed_at DESC LIMIT 1
) es ON true;

CREATE OR REPLACE VIEW board_score_rankings AS
SELECT
  row_number() OVER (ORDER BY es.overall_score DESC) as rank,
  jb.id,
  jb.name,
  es.overall_score,
  es.lifespan_score,
  es.repost_score,
  100.0 - (es.overall_score::numeric / 100.0) as rank_improvement_potential,
  es.computed_at
FROM efficiency_scores es
JOIN job_boards jb ON es.job_board_id = jb.id
WHERE es.computed_at = (
  SELECT MAX(computed_at) FROM efficiency_scores WHERE job_board_id = jb.id
);

-- ==================================================================
-- MIGRATION 010: User Authentication
-- ==================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING ((SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin');

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ==================================================================
-- MIGRATION 011: Employer Surveys
-- ==================================================================

CREATE TABLE IF NOT EXISTS employer_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  successful_hires INTEGER NOT NULL CHECK (successful_hires >= 0),
  average_time_to_hire INTEGER NOT NULL CHECK (average_time_to_hire >= 0),
  candidate_quality TEXT NOT NULL CHECK (candidate_quality IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  posting_experience TEXT NOT NULL CHECK (posting_experience IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  average_cost_per_hire DECIMAL(10, 2) NOT NULL CHECK (average_cost_per_hire >= 0),
  general_notes TEXT,
  job_board_id TEXT,
  job_board_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (job_board_id) REFERENCES job_boards(id) ON DELETE SET NULL
);

CREATE INDEX idx_employer_surveys_company ON employer_surveys(company_name);
CREATE INDEX idx_employer_surveys_industry ON employer_surveys(industry);
CREATE INDEX idx_employer_surveys_board ON employer_surveys(job_board_id);
CREATE INDEX idx_employer_surveys_submitted ON employer_surveys(submitted_at);

-- ==================================================================
-- MIGRATION 012: Candidate Surveys
-- ==================================================================

CREATE TABLE IF NOT EXISTS candidate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_board_name TEXT NOT NULL,
  application_status TEXT NOT NULL CHECK (application_status IN ('applied_only', 'interviewed', 'offered', 'hired', 'rejected')),
  application_experience TEXT NOT NULL CHECK (application_experience IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  posting_clarity TEXT NOT NULL CHECK (posting_clarity IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  interview_quality TEXT NOT NULL CHECK (interview_quality IN ('poor', 'fair', 'good', 'excellent', 'exceptional', 'n_a')),
  communication_throughout TEXT NOT NULL CHECK (communication_throughout IN ('poor', 'fair', 'good', 'excellent', 'exceptional', 'n_a')),
  role_fit TEXT NOT NULL CHECK (role_fit IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  salary_transparency TEXT NOT NULL CHECK (salary_transparency IN ('not_disclosed', 'insufficient', 'adequate', 'competitive', 'excellent')),
  hire_board_again TEXT NOT NULL CHECK (hire_board_again IN ('definitely_not', 'probably_not', 'maybe', 'probably', 'definitely')),
  feedback_notes TEXT,
  job_board_id TEXT,
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (job_board_id) REFERENCES job_boards(id) ON DELETE SET NULL
);

CREATE INDEX idx_candidate_surveys_email ON candidate_surveys(candidate_email);
CREATE INDEX idx_candidate_surveys_board ON candidate_surveys(job_board_id);
CREATE INDEX idx_candidate_surveys_status ON candidate_surveys(application_status);
CREATE INDEX idx_candidate_surveys_submitted ON candidate_surveys(submitted_at DESC);

-- ==================================================================
-- MIGRATION 013: Email System (Day 25)
-- ==================================================================

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subscribe_insights BOOLEAN NOT NULL DEFAULT true,
  subscribe_alerts BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT UNIQUE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  total_recipients INTEGER NOT NULL,
  successful INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('permanent', 'temporary', 'complaint')),
  reason TEXT,
  bounced_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_verified ON email_subscribers(verified);
CREATE INDEX idx_email_subscribers_insights ON email_subscribers(subscribe_insights) WHERE verified = true;
CREATE INDEX idx_email_send_logs_action ON email_send_logs(action);
CREATE INDEX idx_email_send_logs_date ON email_send_logs(sent_at DESC);
CREATE INDEX idx_email_bounces_email ON email_bounces(email);

CREATE OR REPLACE FUNCTION auto_unsubscribe_bounces()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bounce_type = 'permanent' THEN
    UPDATE email_subscribers
    SET subscribe_insights = false, subscribe_alerts = false
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_unsubscribe_bounces
AFTER INSERT ON email_bounces
FOR EACH ROW
EXECUTE FUNCTION auto_unsubscribe_bounces();

-- ==================================================================
-- ALL BASE TABLES CREATED - READY FOR DATA
-- ==================================================================
