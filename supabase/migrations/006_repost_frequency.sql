-- Day 10: Add Repost Frequency Views and Aggregations
-- Database views for efficient repost frequency analytics queries

-- Create view for board repost frequency statistics
CREATE OR REPLACE VIEW board_repost_frequency_stats AS
SELECT
  jb.id,
  jb.name,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END) as reposted_postings,
  SUM(jp.repost_count) as total_reposts,
  ROUND((COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100, 1) as repost_rate,
  ROUND(AVG(jp.repost_count)::numeric, 2) as avg_reposts_per_posting,
  MAX(jp.repost_count) as max_reposts_single,
  COUNT(CASE WHEN jp.repost_count >= 3 THEN 1 END) as chronic_reposters
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

-- Create view for role family repost frequency
CREATE OR REPLACE VIEW role_family_repost_frequency_stats AS
SELECT
  jp.normalized_title as role_family,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END) as reposted_postings,
  ROUND((COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100, 1) as repost_rate,
  ROUND(AVG(jp.repost_count)::numeric, 2) as avg_reposts_per_posting,
  COUNT(DISTINCT jp.job_board_id) as distinct_boards
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
GROUP BY jp.normalized_title
ORDER BY repost_rate DESC;

-- Create view for daily repost trends
CREATE OR REPLACE VIEW daily_repost_trends AS
SELECT
  rds.snapshot_date::DATE as date,
  jb.id,
  jb.name,
  rds.repost_postings as new_reposts_detected,
  ROUND((rds.repost_postings::numeric / rds.posting_count) * 100, 1) as repost_rate_at_date
FROM raw_data_snapshots rds
JOIN job_boards jb ON rds.job_board_id = jb.id
ORDER BY rds.snapshot_date DESC;

-- Create view for top reposted postings per board
CREATE OR REPLACE VIEW top_reposted_postings AS
SELECT
  jp.id,
  jp.job_board_id,
  jb.name as board_name,
  jp.title,
  jp.company,
  jp.repost_count,
  jp.first_seen,
  jp.last_seen,
  EXTRACT(DAY FROM (jp.last_seen - jp.first_seen))::int as days_active,
  ROW_NUMBER() OVER (PARTITION BY jp.job_board_id ORDER BY jp.repost_count DESC) as rank
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.repost_count > 0;

-- Create view for repost clustering
CREATE OR REPLACE VIEW repost_clusters AS
SELECT
  jp.repost_cluster_id,
  COUNT(*) as cluster_size,
  COUNT(DISTINCT jp.job_board_id) as boards_in_cluster,
  STRING_AGG(DISTINCT jb.name, ', ') as board_names,
  MIN(jp.first_seen) as earliest_posting,
  MAX(jp.last_seen) as latest_posting,
  EXTRACT(DAY FROM (MAX(jp.last_seen) - MIN(jp.first_seen)))::int as days_from_first_to_last,
  COUNT(CASE WHEN jp.repost_count >= 3 THEN 1 END) as chronic_instances
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.repost_cluster_id IS NOT NULL
GROUP BY jp.repost_cluster_id;

-- Create view for repost severity assessment
CREATE OR REPLACE VIEW repost_severity_assessment AS
SELECT
  jb.id,
  jb.name,
  ROUND((COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100, 1) as repost_rate,
  CASE
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 5 THEN 'excellent'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 15 THEN 'good'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 30 THEN 'moderate'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 50 THEN 'concerning'
    ELSE 'critical'
  END as severity_level,
  CASE
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 5 THEN 'Very low duplication - excellent data quality'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 15 THEN 'Low duplication - good data quality'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 30 THEN 'Moderate duplication - acceptable'
    WHEN (COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END)::numeric / COUNT(*)) * 100 < 50 THEN 'High duplication - concerning'
    ELSE 'Severe duplication - critical issues'
  END as description
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_postings_repost_count ON job_postings(repost_count)
  WHERE repost_count > 0;

CREATE INDEX IF NOT EXISTS idx_postings_repost_cluster ON job_postings(repost_cluster_id)
  WHERE repost_cluster_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posting_events_event_date ON posting_events(event_date DESC);
