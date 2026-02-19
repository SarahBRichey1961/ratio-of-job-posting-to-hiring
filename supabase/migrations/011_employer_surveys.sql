-- Day 22: Create employer_surveys table for survey feedback
-- Stores feedback from employers about their experience with job boards

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

-- Create indexes for common queries
CREATE INDEX idx_employer_surveys_company ON employer_surveys(company_name);
CREATE INDEX idx_employer_surveys_industry ON employer_surveys(industry);
CREATE INDEX idx_employer_surveys_board ON employer_surveys(job_board_id);
CREATE INDEX idx_employer_surveys_submitted ON employer_surveys(submitted_at);

-- Optional: Create view for aggregate survey stats by board
CREATE OR REPLACE VIEW employer_survey_stats_by_board AS
SELECT
  job_board_id,
  job_board_name,
  COUNT(*) as total_surveys,
  AVG(successful_hires) as avg_successful_hires,
  AVG(average_time_to_hire) as avg_time_to_hire_days,
  AVG(average_cost_per_hire) as avg_cost_per_hire,
  -- Calculate quality score (1-5 scale)
  ROUND(AVG(
    CASE
      WHEN candidate_quality = 'poor' THEN 1
      WHEN candidate_quality = 'fair' THEN 2
      WHEN candidate_quality = 'good' THEN 3
      WHEN candidate_quality = 'excellent' THEN 4
      WHEN candidate_quality = 'exceptional' THEN 5
      ELSE 3
    END
  ), 2) as avg_candidate_quality_score,
  ROUND(AVG(
    CASE
      WHEN posting_experience = 'poor' THEN 1
      WHEN posting_experience = 'fair' THEN 2
      WHEN posting_experience = 'good' THEN 3
      WHEN posting_experience = 'excellent' THEN 4
      WHEN posting_experience = 'exceptional' THEN 5
      ELSE 3
    END
  ), 2) as avg_posting_experience_score,
  MAX(submitted_at) as latest_submission
FROM employer_surveys
GROUP BY job_board_id, job_board_name;
