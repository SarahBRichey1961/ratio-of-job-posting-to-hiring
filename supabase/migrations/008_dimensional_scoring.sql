-- Day 12: Add Dimensional Scoring Views
-- Database views for role-based and industry-based scoring

-- Create view for role family scoring
CREATE OR REPLACE VIEW role_family_scoring AS
SELECT
  jp.normalized_title as role_family,
  COUNT(*) as total_jobs,
  COUNT(DISTINCT jp.job_board_id) as distinct_boards,
  ROUND(AVG((
    SELECT overall_score FROM efficiency_scores es
    WHERE es.job_board_id = jp.job_board_id
    ORDER BY computed_at DESC LIMIT 1
  ))::numeric, 1) as avg_board_score,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (
    SELECT overall_score FROM efficiency_scores es
    WHERE es.job_board_id = jp.job_board_id
    ORDER BY computed_at DESC LIMIT 1
  ))::numeric, 1) as median_board_score,
  MIN((
    SELECT overall_score FROM efficiency_scores es
    WHERE es.job_board_id = jp.job_board_id
    ORDER BY computed_at DESC LIMIT 1
  )) as min_board_score,
  MAX((
    SELECT overall_score FROM efficiency_scores es
    WHERE es.job_board_id = jp.job_board_id
    ORDER BY computed_at DESC LIMIT 1
  )) as max_board_score
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title;

-- Create view for competitive analysis by role
CREATE OR REPLACE VIEW role_competitive_landscape AS
SELECT
  jp.normalized_title as role_family,
  jb.id as board_id,
  jb.name as board_name,
  COUNT(*) as job_count,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan,
  ROUND((COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100, 1) as repost_rate,
  (SELECT overall_score FROM efficiency_scores es
   WHERE es.job_board_id = jb.id
   ORDER BY computed_at DESC LIMIT 1) as board_score
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title, jb.id, jb.name;

-- Create materialized view for industry categorization
CREATE MATERIALIZED VIEW IF NOT EXISTS board_industry_classification AS
SELECT
  jb.id,
  jb.name,
  CASE
    WHEN LOWER(jb.name) LIKE '%stack%' OR LOWER(jb.name) LIKE '%github%' OR LOWER(jb.name) LIKE '%dev%' THEN 'Tech'
    WHEN LOWER(jb.name) LIKE '%remote%' OR LOWER(jb.name) LIKE '%distributed%' THEN 'Remote'
    WHEN LOWER(jb.name) LIKE '%linkedin%' OR LOWER(jb.name) LIKE '%indeed%' OR LOWER(jb.name) LIKE '%glassdoor%' THEN 'General'
    ELSE 'Niche'
  END as industry_category,
  (SELECT overall_score FROM efficiency_scores es
   WHERE es.job_board_id = jb.id
   ORDER BY computed_at DESC LIMIT 1) as current_score
FROM job_boards jb;

CREATE UNIQUE INDEX idx_board_industry_id ON board_industry_classification(id);

-- Create view for industry efficiency comparison
CREATE OR REPLACE VIEW industry_efficiency_summary AS
SELECT
  CASE
    WHEN LOWER(jb.name) LIKE '%stack%' OR LOWER(jb.name) LIKE '%github%' OR LOWER(jb.name) LIKE '%dev%' THEN 'Tech'
    WHEN LOWER(jb.name) LIKE '%remote%' OR LOWER(jb.name) LIKE '%distributed%' THEN 'Remote'
    WHEN LOWER(jb.name) LIKE '%linkedin%' OR LOWER(jb.name) LIKE '%indeed%' OR LOWER(jb.name) LIKE '%glassdoor%' THEN 'General'
    ELSE 'Niche'
  END as industry,
  COUNT(DISTINCT jb.id) as board_count,
  COUNT(jp.id) as total_jobs,
  ROUND(AVG((
    SELECT overall_score FROM efficiency_scores es
    WHERE es.job_board_id = jb.id
    ORDER BY computed_at DESC LIMIT 1
  ))::numeric, 1) as avg_score,
  STRING_AGG(DISTINCT jp.normalized_title, ', ' ORDER BY jp.normalized_title LIMIT 10) as top_roles
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY industry;

-- Create view for hiring velocity by role
CREATE OR REPLACE VIEW role_hiring_velocity AS
SELECT
  jp.normalized_title as role_family,
  DATE(jp.first_seen) as posted_date,
  COUNT(*) as new_jobs_posted,
  COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END) as reposted_count,
  ROUND(AVG(jp.repost_count)::numeric, 2) as avg_reposts
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title, DATE(jp.first_seen)
ORDER BY posted_date DESC;

-- Create view for role demand classification
CREATE OR REPLACE VIEW role_demand_classification AS
SELECT
  jp.normalized_title as role_family,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.first_seen > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as postings_last_30_days,
  ROUND((COUNT(CASE WHEN jp.first_seen > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END)::numeric / 30), 2) as avg_daily_postings,
  CASE
    WHEN COUNT(*) > 200 THEN 'High'
    WHEN COUNT(*) > 50 THEN 'Medium'
    ELSE 'Low'
  END as demand_level
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_postings_normalized_title ON job_postings(normalized_title)
  WHERE normalized_title IS NOT NULL;

GRANT SELECT ON role_family_scoring TO authenticated;
GRANT SELECT ON role_competitive_landscape TO authenticated;
GRANT SELECT ON board_industry_classification TO authenticated;
GRANT SELECT ON industry_efficiency_summary TO authenticated;
GRANT SELECT ON role_hiring_velocity TO authenticated;
GRANT SELECT ON role_demand_classification TO authenticated;
