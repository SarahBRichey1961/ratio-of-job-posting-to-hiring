-- Day 13: Build Trend Tracking
-- Database tables and views for historical trend analysis

-- Create trend_snapshots table for storing daily/weekly metric snapshots
CREATE TABLE IF NOT EXISTS trend_snapshots (
  id SERIAL PRIMARY KEY,
  job_board_id INTEGER NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Core metrics at snapshot time
  overall_score DECIMAL(5,2),
  avg_lifespan_days INTEGER,
  avg_repost_rate DECIMAL(5,2),
  avg_employer_score DECIMAL(5,2) DEFAULT 50,
  avg_candidate_score DECIMAL(5,2) DEFAULT 50,
  total_postings INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(job_board_id, snapshot_date)
);

CREATE INDEX idx_snapshots_board_date ON trend_snapshots(job_board_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_date ON trend_snapshots(snapshot_date DESC);

-- Create view for trend analysis
CREATE OR REPLACE VIEW board_trend_summary AS
SELECT
  ts1.job_board_id as board_id,
  jb.name as board_name,
  ts1.overall_score as current_score,
  ts7.overall_score as week_ago_score,
  ts30.overall_score as month_ago_score,
  (ts1.overall_score - ts7.overall_score) as week_change,
  (ts1.overall_score - ts30.overall_score) as month_change,
  CASE
    WHEN (ts1.overall_score - ts7.overall_score) > 2 THEN 'up'
    WHEN (ts1.overall_score - ts7.overall_score) < -2 THEN 'down'
    ELSE 'stable'
  END as week_trend,
  CASE
    WHEN (ts1.overall_score - ts30.overall_score) > 5 THEN 'up'
    WHEN (ts1.overall_score - ts30.overall_score) < -5 THEN 'down'
    ELSE 'stable'
  END as month_trend,
  ts1.total_postings as current_postings,
  ts1.avg_lifespan_days as current_lifespan,
  ts1.avg_repost_rate as current_repost_rate
FROM trend_snapshots ts1
JOIN job_boards jb ON ts1.job_board_id = jb.id
LEFT JOIN trend_snapshots ts7 ON ts1.job_board_id = ts7.job_board_id AND ts7.snapshot_date = CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN trend_snapshots ts30 ON ts1.job_board_id = ts30.job_board_id AND ts30.snapshot_date = CURRENT_DATE - INTERVAL '30 days'
WHERE ts1.snapshot_date = CURRENT_DATE;

-- Create view for weekly aggregates
CREATE OR REPLACE VIEW weekly_board_metrics AS
SELECT
  EXTRACT(YEAR FROM ts.snapshot_date)::INT as year,
  EXTRACT(WEEK FROM ts.snapshot_date)::INT as week_number,
  ts.job_board_id,
  jb.name as board_name,
  ROUND(AVG(ts.overall_score)::numeric, 2) as avg_score,
  MIN(ts.overall_score) as min_score,
  MAX(ts.overall_score) as max_score,
  ROUND(STDDEV_POP(ts.overall_score)::numeric, 2) as volatility,
  COUNT(*) as snapshot_count
FROM trend_snapshots ts
JOIN job_boards jb ON ts.job_board_id = jb.id
GROUP BY EXTRACT(YEAR FROM ts.snapshot_date), EXTRACT(WEEK FROM ts.snapshot_date), ts.job_board_id, jb.name;

-- Create materialized view for performance snapshots
CREATE MATERIALIZED VIEW IF NOT EXISTS trend_snapshot_latest AS
SELECT DISTINCT ON (ts.job_board_id)
  ts.job_board_id,
  jb.name as board_name,
  ts.snapshot_date,
  ts.overall_score,
  ts.avg_lifespan_days,
  ts.avg_repost_rate,
  ts.total_postings,
  LAG(ts.overall_score) OVER (PARTITION BY ts.job_board_id ORDER BY ts.snapshot_date) as previous_score
FROM trend_snapshots ts
JOIN job_boards jb ON ts.job_board_id = jb.id
ORDER BY ts.job_board_id, ts.snapshot_date DESC;

CREATE UNIQUE INDEX idx_trend_snapshot_latest_board ON trend_snapshot_latest(job_board_id);

-- Create view for anomaly detection
CREATE OR REPLACE VIEW anomaly_candidates AS
SELECT
  ts.job_board_id,
  jb.name as board_name,
  ts.snapshot_date,
  ts.overall_score,
  ROUND(AVG(ts.overall_score) OVER (PARTITION BY ts.job_board_id ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)::numeric, 2) as avg_score_30d,
  ROUND(STDDEV_POP(ts.overall_score) OVER (PARTITION BY ts.job_board_id ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)::numeric, 2) as stddev_score_30d,
  ROUND(AVG(ts.avg_lifespan_days) OVER (PARTITION BY ts.job_board_id ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)::numeric, 1) as avg_lifespan_30d,
  ROUND(STDDEV_POP(ts.avg_lifespan_days) OVER (PARTITION BY ts.job_board_id ROWS BETWEEN 29 PRECEDING AND CURRENT ROW)::numeric, 1) as stddev_lifespan_30d
FROM trend_snapshots ts
JOIN job_boards jb ON ts.job_board_id = jb.id
WHERE ts.snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ts.job_board_id, ts.snapshot_date DESC;

-- Create view for momentum calculation
CREATE OR REPLACE VIEW board_momentum AS
SELECT
  jb.id as board_id,
  jb.name,
  CASE
    WHEN ts_curr.overall_score IS NULL THEN 0
    WHEN ts_7d.overall_score IS NULL THEN 0
    ELSE ts_curr.overall_score - ts_7d.overall_score
  END as momentum_7d,
  CASE
    WHEN ts_curr.overall_score IS NULL THEN 0
    WHEN ts_30d.overall_score IS NULL THEN 0
    ELSE ts_curr.overall_score - ts_30d.overall_score
  END as momentum_30d,
  ts_curr.overall_score as current_score,
  ts_curr.snapshot_date as last_snapshot_date
FROM job_boards jb
LEFT JOIN (
  SELECT DISTINCT ON (job_board_id) job_board_id, overall_score, snapshot_date
  FROM trend_snapshots
  WHERE snapshot_date <= CURRENT_DATE
  ORDER BY job_board_id, snapshot_date DESC
) ts_curr ON jb.id = ts_curr.job_board_id
LEFT JOIN trend_snapshots ts_7d ON jb.id = ts_7d.job_board_id AND ts_7d.snapshot_date = CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN trend_snapshots ts_30d ON jb.id = ts_30d.job_board_id AND ts_30d.snapshot_date = CURRENT_DATE - INTERVAL '30 days';

GRANT SELECT ON trend_snapshots TO authenticated;
GRANT INSERT ON trend_snapshots TO authenticated;
GRANT UPDATE ON trend_snapshots TO authenticated;
GRANT SELECT ON board_trend_summary TO authenticated;
GRANT SELECT ON weekly_board_metrics TO authenticated;
GRANT SELECT ON trend_snapshot_latest TO authenticated;
GRANT SELECT ON anomaly_candidates TO authenticated;
GRANT SELECT ON board_momentum TO authenticated;
