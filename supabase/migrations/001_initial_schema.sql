-- Day 2: Database Schema Migration
-- Creates all core tables for job posting ratio analysis

-- 1. job_boards table
CREATE TABLE IF NOT EXISTS job_boards (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  url VARCHAR(500),
  category VARCHAR(50) NOT NULL, -- 'general', 'tech', 'remote', 'niche'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. job_postings table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. posting_events table (tracks individual post appearances)
CREATE TABLE IF NOT EXISTS posting_events (
  id BIGSERIAL PRIMARY KEY,
  job_posting_id BIGINT NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'appeared', 'reappeared', 'disappeared'
  event_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. employer_surveys table
CREATE TABLE IF NOT EXISTS employer_surveys (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  hiring_effectiveness INT, -- 1-10 scale
  fill_time_days INT,
  candidate_quality VARCHAR(100), -- 'excellent', 'good', 'fair', 'poor'
  comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. candidate_surveys table
CREATE TABLE IF NOT EXISTS candidate_surveys (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  candidate_name VARCHAR(255),
  contact_email VARCHAR(255),
  job_board_experience INT, -- 1-10 scale
  posting_relevance INT, -- 1-10 scale
  ease_of_application INT, -- 1-10 scale
  likelihood_recommend INT, -- 1-10 scale (NPS)
  comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. efficiency_scores table
CREATE TABLE IF NOT EXISTS efficiency_scores (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  overall_score DECIMAL(5, 2), -- 0-100 scale
  lifespan_score DECIMAL(5, 2), -- 40% weight
  repost_score DECIMAL(5, 2), -- 30% weight
  employer_survey_score DECIMAL(5, 2), -- 20% weight
  candidate_survey_score DECIMAL(5, 2), -- 10% weight
  role_family VARCHAR(100), -- optional: score by role
  industry VARCHAR(100), -- optional: score by industry
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, score_date, role_family, industry)
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_job_postings_board_id ON job_postings(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_first_seen ON job_postings(first_seen);
CREATE INDEX IF NOT EXISTS idx_job_postings_last_seen ON job_postings(last_seen);
CREATE INDEX IF NOT EXISTS idx_posting_events_posting_id ON posting_events(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_posting_events_event_date ON posting_events(event_date);
CREATE INDEX IF NOT EXISTS idx_employer_surveys_board_id ON employer_surveys(job_board_id);
CREATE INDEX IF NOT EXISTS idx_candidate_surveys_board_id ON candidate_surveys(job_board_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_board_id ON efficiency_scores(job_board_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_score_date ON efficiency_scores(score_date);

-- Grant appropriate permissions (adjust as needed)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT INSERT, UPDATE ON job_postings, posting_events TO authenticated;
-- GRANT INSERT ON employer_surveys, candidate_surveys TO authenticated;
