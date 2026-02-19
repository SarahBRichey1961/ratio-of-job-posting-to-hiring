-- Day 9: Add Lifespan Metrics Views and Aggregations
-- Database views for efficient lifespan analytics queries

-- Create view for board lifespan statistics
CREATE OR REPLACE VIEW board_lifespan_stats AS
SELECT
  jb.id,
  jb.name,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.disappeared = FALSE THEN 1 END) as active_postings,
  COUNT(CASE WHEN jp.disappeared = TRUE THEN 1 END) as disappeared_postings,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jp.lifespan_days) as median_lifespan,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY jp.lifespan_days) as p25_lifespan,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY jp.lifespan_days) as p75_lifespan,
  MIN(jp.lifespan_days) as min_lifespan,
  MAX(jp.lifespan_days) as max_lifespan,
  ROUND(AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - jp.first_seen)))::numeric, 1) as active_days_avg
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

-- Create view for role family lifespan statistics
CREATE OR REPLACE VIEW role_family_lifespan_stats AS
SELECT
  jp.normalized_title as role_family,
  COUNT(*) as total_postings,
  COUNT(DISTINCT jp.job_board_id) as distinct_boards,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jp.lifespan_days) as median_lifespan,
  MIN(jp.lifespan_days) as min_lifespan,
  MAX(jp.lifespan_days) as max_lifespan
FROM job_postings jp
WHERE jp.normalized_title IS NOT NULL
  AND jp.lifespan_days IS NOT NULL
GROUP BY jp.normalized_title
ORDER BY avg_lifespan DESC;

-- Create view for daily lifespan trends
CREATE OR REPLACE VIEW daily_lifespan_trends AS
SELECT
  rds.snapshot_date::DATE as date,
  jb.id,
  jb.name,
  rds.posting_count,
  rds.new_postings,
  rds.disappeared_postings,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan_at_date
FROM raw_data_snapshots rds
JOIN job_boards jb ON rds.job_board_id = jb.id
LEFT JOIN job_postings jp ON jp.job_board_id = jb.id 
  AND jp.first_seen <= rds.snapshot_date 
  AND (jp.disappeared = FALSE OR jp.disappeared_at >= rds.snapshot_date)
GROUP BY rds.snapshot_date, jb.id, jb.name, rds.posting_count, rds.new_postings, rds.disappeared_postings;

-- Create view for lifespan percentile rankings
CREATE OR REPLACE VIEW lifespan_percentile_rankings AS
SELECT
  jb.id,
  jb.name,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan,
  PERCENT_RANK() OVER (ORDER BY AVG(jp.lifespan_days)) * 100 as percentile_rank
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

-- Create view for lifespan distribution buckets
CREATE OR REPLACE VIEW lifespan_distribution_buckets AS
SELECT
  jp.job_board_id,
  jb.name,
  CASE
    WHEN jp.lifespan_days < 8 THEN '0-7 days'
    WHEN jp.lifespan_days < 15 THEN '8-14 days'
    WHEN jp.lifespan_days < 31 THEN '15-30 days'
    WHEN jp.lifespan_days < 61 THEN '31-60 days'
    WHEN jp.lifespan_days < 91 THEN '61-90 days'
    ELSE '90+ days'
  END as bucket,
  COUNT(*) as count
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.lifespan_days IS NOT NULL
GROUP BY jp.job_board_id, jb.name, bucket;

-- Create materialized view for fast access (optional, requires refresh)
CREATE MATERIALIZED VIEW IF NOT EXISTS lifespan_metrics_snapshot AS
SELECT
  jb.id as board_id,
  jb.name as board_name,
  COUNT(*) as total_postings,
  COUNT(CASE WHEN jp.disappeared = FALSE THEN 1 END) as active_postings,
  ROUND(AVG(jp.lifespan_days)::numeric, 1) as avg_lifespan,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY jp.lifespan_days) as median_lifespan,
  MIN(jp.lifespan_days) as min_lifespan,
  MAX(jp.lifespan_days) as max_lifespan,
  CURRENT_TIMESTAMP as computed_at
FROM job_boards jb
LEFT JOIN job_postings jp ON jb.id = jp.job_board_id
GROUP BY jb.id, jb.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lifespan_snapshot_board 
  ON lifespan_metrics_snapshot(board_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_postings_lifespan_actual ON job_postings(lifespan_days)
  WHERE lifespan_days IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_postings_first_seen ON job_postings(first_seen);
CREATE INDEX IF NOT EXISTS idx_postings_last_seen ON job_postings(last_seen);
CREATE INDEX IF NOT EXISTS idx_postings_normalized_title ON job_postings(normalized_title)
  WHERE normalized_title IS NOT NULL;
