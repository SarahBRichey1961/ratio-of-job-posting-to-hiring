-- Day 11: Add Scoring Algorithm Tables and Views
-- Database tables and views for efficiency scoring

-- Create efficiency_scores table
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

-- Create index for efficient queries
CREATE INDEX idx_efficiency_scores_board_id ON efficiency_scores(job_board_id);
CREATE INDEX idx_efficiency_scores_overall ON efficiency_scores(overall_score DESC);
CREATE INDEX idx_efficiency_scores_computed_at ON efficiency_scores(computed_at DESC);

-- Create view for current board scores
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

-- Create view for board score rankings
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

-- Create view for score distribution
CREATE OR REPLACE VIEW score_distribution AS
SELECT
  CASE
    WHEN overall_score >= 90 THEN '90-100'
    WHEN overall_score >= 80 THEN '80-89'
    WHEN overall_score >= 70 THEN '70-79'
    WHEN overall_score >= 60 THEN '60-69'
    WHEN overall_score >= 50 THEN '50-59'
    ELSE '0-49'
  END as score_range,
  COUNT(*) as board_count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM job_boards) * 100, 1) as percentage
FROM (
  SELECT DISTINCT ON (job_board_id) overall_score
  FROM efficiency_scores
  ORDER BY job_board_id, computed_at DESC
) latest_scores
GROUP BY
  CASE
    WHEN overall_score >= 90 THEN '90-100'
    WHEN overall_score >= 80 THEN '80-89'
    WHEN overall_score >= 70 THEN '70-79'
    WHEN overall_score >= 60 THEN '60-69'
    WHEN overall_score >= 50 THEN '50-59'
    ELSE '0-49'
  END;

-- Create view for score trends (week over week)
CREATE OR REPLACE VIEW score_trends_weekly AS
SELECT
  DATE_TRUNC('week', es.computed_at)::DATE as week,
  jb.id,
  jb.name,
  ROUND(AVG(es.overall_score)::numeric, 1) as weekly_avg_score,
  LAG(ROUND(AVG(es.overall_score)::numeric, 1)) OVER (
    PARTITION BY jb.id ORDER BY DATE_TRUNC('week', es.computed_at)
  ) as prev_week_avg_score,
  ROUND(AVG(es.overall_score)::numeric, 1) - LAG(ROUND(AVG(es.overall_score)::numeric, 1)) OVER (
    PARTITION BY jb.id ORDER BY DATE_TRUNC('week', es.computed_at)
  ) as trend
FROM efficiency_scores es
JOIN job_boards jb ON es.job_board_id = jb.id
GROUP BY DATE_TRUNC('week', es.computed_at), jb.id, jb.name
ORDER BY week DESC;

-- Create view for role family score performance
CREATE OR REPLACE VIEW role_family_score_performance AS
SELECT
  jp.normalized_title as role_family,
  COUNT(DISTINCT jp.job_board_id) as boards_offering,
  COUNT(*) as posting_count,
  ROUND(AVG(
    COALESCE((
      SELECT overall_score FROM efficiency_scores es
      WHERE es.job_board_id = jp.job_board_id
      ORDER BY computed_at DESC LIMIT 1
    ), 50)
  )::numeric, 1) as avg_board_score,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY 
    COALESCE((
      SELECT overall_score FROM efficiency_scores es
      WHERE es.job_board_id = jp.job_board_id
      ORDER BY computed_at DESC LIMIT 1
    ), 50)
  )::numeric, 1) as median_board_score
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title
ORDER BY avg_board_score DESC;

-- Create materialized view for fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS score_summary_snapshot AS
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
  CASE
    WHEN es.overall_score >= 90 THEN 'A+'
    WHEN es.overall_score >= 85 THEN 'A'
    WHEN es.overall_score >= 80 THEN 'B+'
    WHEN es.overall_score >= 75 THEN 'B'
    WHEN es.overall_score >= 70 THEN 'C+'
    WHEN es.overall_score >= 60 THEN 'C'
    WHEN es.overall_score >= 50 THEN 'D'
    ELSE 'F'
  END as grade,
  es.computed_at,
  CURRENT_TIMESTAMP as snapshot_created_at
FROM job_boards jb
LEFT JOIN LATERAL (
  SELECT * FROM efficiency_scores
  WHERE job_board_id = jb.id
  ORDER BY computed_at DESC LIMIT 1
) es ON true;

CREATE UNIQUE INDEX idx_score_snapshot_board ON score_summary_snapshot(id);

-- Grant permissions
GRANT SELECT ON efficiency_scores TO authenticated;
GRANT INSERT ON efficiency_scores TO authenticated;
GRANT SELECT ON current_board_scores TO authenticated;
GRANT SELECT ON board_score_rankings TO authenticated;
GRANT SELECT ON score_distribution TO authenticated;
GRANT SELECT ON score_trends_weekly TO authenticated;
GRANT SELECT ON role_family_score_performance TO authenticated;
GRANT SELECT ON score_summary_snapshot TO authenticated;
