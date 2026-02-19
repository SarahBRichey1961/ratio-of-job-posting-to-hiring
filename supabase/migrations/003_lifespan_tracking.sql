-- Day 6: Add Lifespan Tracking Utilities
-- This migration adds helper functions for tracking posting lifespan

-- Create a view for active postings
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

-- Create a view for disappeared postings
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

-- Create a view for lifespan statistics by board
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

-- Create a view for lifespan statistics by role family
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

-- Create a view for posting events timeline
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

-- Add index for faster lifespan analytics
CREATE INDEX IF NOT EXISTS idx_postings_lifespan_days ON job_postings(lifespan_days);
CREATE INDEX IF NOT EXISTS idx_postings_disappeared ON job_postings(disappeared);
CREATE INDEX IF NOT EXISTS idx_postings_role_family ON job_postings(normalized_title);
CREATE INDEX IF NOT EXISTS idx_posting_events_type ON posting_events(event_type);
