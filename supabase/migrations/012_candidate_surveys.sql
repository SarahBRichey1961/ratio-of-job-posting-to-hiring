-- Create candidate_surveys table
CREATE TABLE IF NOT EXISTS candidate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Candidate Contact Information
  candidate_email TEXT NOT NULL,
  
  -- Application Details
  job_title TEXT NOT NULL,
  job_board_name TEXT NOT NULL,
  application_status TEXT NOT NULL CHECK (application_status IN ('applied_only', 'interviewed', 'offered', 'hired', 'rejected')),
  
  -- Experience Ratings (1-5 scale)
  application_experience TEXT NOT NULL CHECK (application_experience IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  posting_clarity TEXT NOT NULL CHECK (posting_clarity IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  interview_quality TEXT NOT NULL CHECK (interview_quality IN ('poor', 'fair', 'good', 'excellent', 'exceptional', 'n_a')),
  communication_throughout TEXT NOT NULL CHECK (communication_throughout IN ('poor', 'fair', 'good', 'excellent', 'exceptional', 'n_a')),
  role_fit TEXT NOT NULL CHECK (role_fit IN ('poor', 'fair', 'good', 'excellent', 'exceptional')),
  
  -- Salary Transparency
  salary_transparency TEXT NOT NULL CHECK (salary_transparency IN ('not_disclosed', 'insufficient', 'adequate', 'competitive', 'excellent')),
  
  -- Recommendation
  hire_board_again TEXT NOT NULL CHECK (hire_board_again IN ('definitely_not', 'probably_not', 'maybe', 'probably', 'definitely')),
  
  -- Optional Information
  feedback_notes TEXT,
  job_board_id TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (job_board_id) REFERENCES job_boards(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_candidate_surveys_email 
  ON candidate_surveys(candidate_email);

CREATE INDEX idx_candidate_surveys_board 
  ON candidate_surveys(job_board_id);

CREATE INDEX idx_candidate_surveys_status 
  ON candidate_surveys(application_status);

CREATE INDEX idx_candidate_surveys_submitted 
  ON candidate_surveys(submitted_at DESC);

-- Create aggregation view for candidate feedback by board
CREATE VIEW candidate_survey_stats_by_board AS
SELECT 
  job_board_id,
  job_board_name,
  COUNT(*) as survey_count,
  
  -- Application outcomes
  ROUND((COUNT(*) FILTER (WHERE application_status = 'hired') * 100.0 / COUNT(*))::numeric, 1) as hired_percentage,
  ROUND((COUNT(*) FILTER (WHERE application_status = 'offered') * 100.0 / COUNT(*))::numeric, 1) as offer_percentage,
  
  -- Quality metrics (converted to 1-5 numeric scale)
  ROUND(AVG(
    CASE 
      WHEN application_experience = 'exceptional' THEN 5
      WHEN application_experience = 'excellent' THEN 4.5
      WHEN application_experience = 'good' THEN 3.5
      WHEN application_experience = 'fair' THEN 2.5
      WHEN application_experience = 'poor' THEN 1
    END
  )::numeric, 2) as avg_application_experience,
  
  ROUND(AVG(
    CASE 
      WHEN posting_clarity = 'exceptional' THEN 5
      WHEN posting_clarity = 'excellent' THEN 4.5
      WHEN posting_clarity = 'good' THEN 3.5
      WHEN posting_clarity = 'fair' THEN 2.5
      WHEN posting_clarity = 'poor' THEN 1
    END
  )::numeric, 2) as avg_posting_clarity,
  
  ROUND(AVG(
    CASE 
      WHEN interview_quality = 'exceptional' THEN 5
      WHEN interview_quality = 'excellent' THEN 4.5
      WHEN interview_quality = 'good' THEN 3.5
      WHEN interview_quality = 'fair' THEN 2.5
      WHEN interview_quality = 'poor' THEN 1
      WHEN interview_quality = 'n_a' THEN NULL
    END
  )::numeric, 2) as avg_interview_quality,
  
  ROUND(AVG(
    CASE 
      WHEN communication_throughout = 'exceptional' THEN 5
      WHEN communication_throughout = 'excellent' THEN 4.5
      WHEN communication_throughout = 'good' THEN 3.5
      WHEN communication_throughout = 'fair' THEN 2.5
      WHEN communication_throughout = 'poor' THEN 1
      WHEN communication_throughout = 'n_a' THEN NULL
    END
  )::numeric, 2) as avg_communication,
  
  ROUND(AVG(
    CASE 
      WHEN role_fit = 'exceptional' THEN 5
      WHEN role_fit = 'excellent' THEN 4.5
      WHEN role_fit = 'good' THEN 3.5
      WHEN role_fit = 'fair' THEN 2.5
      WHEN role_fit = 'poor' THEN 1
    END
  )::numeric, 2) as avg_role_fit,
  
  -- Salary transparency (converted to 1-5 scale)
  ROUND(AVG(
    CASE 
      WHEN salary_transparency = 'excellent' THEN 5
      WHEN salary_transparency = 'competitive' THEN 4
      WHEN salary_transparency = 'adequate' THEN 3
      WHEN salary_transparency = 'insufficient' THEN 2
      WHEN salary_transparency = 'not_disclosed' THEN 1
    END
  )::numeric, 2) as avg_salary_transparency,
  
  -- Recommendation (5-scale)
  ROUND(AVG(
    CASE 
      WHEN hire_board_again = 'definitely' THEN 5
      WHEN hire_board_again = 'probably' THEN 4
      WHEN hire_board_again = 'maybe' THEN 3
      WHEN hire_board_again = 'probably_not' THEN 2
      WHEN hire_board_again = 'definitely_not' THEN 1
    END
  )::numeric, 2) as avg_recommendation,
  
  -- Overall candidate satisfaction (composite 1-5)
  ROUND(((
    ROUND(AVG(
      CASE 
        WHEN application_experience = 'exceptional' THEN 5
        WHEN application_experience = 'excellent' THEN 4.5
        WHEN application_experience = 'good' THEN 3.5
        WHEN application_experience = 'fair' THEN 2.5
        WHEN application_experience = 'poor' THEN 1
      END
    )::numeric, 2) +
    ROUND(AVG(
      CASE 
        WHEN posting_clarity = 'exceptional' THEN 5
        WHEN posting_clarity = 'excellent' THEN 4.5
        WHEN posting_clarity = 'good' THEN 3.5
        WHEN posting_clarity = 'fair' THEN 2.5
        WHEN posting_clarity = 'poor' THEN 1
      END
    )::numeric, 2) +
    ROUND(AVG(
      CASE 
        WHEN role_fit = 'exceptional' THEN 5
        WHEN role_fit = 'excellent' THEN 4.5
        WHEN role_fit = 'good' THEN 3.5
        WHEN role_fit = 'fair' THEN 2.5
        WHEN role_fit = 'poor' THEN 1
      END
    )::numeric, 2)
  ) / 3)::numeric, 2) as overall_satisfaction_score,
  
  MAX(submitted_at) as latest_submission
FROM candidate_surveys
WHERE job_board_id IS NOT NULL
GROUP BY job_board_id, job_board_name
ORDER BY survey_count DESC, latest_submission DESC;
