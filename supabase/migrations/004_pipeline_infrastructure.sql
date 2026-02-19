-- Day 8: Add Pipeline Infrastructure Tables
-- Database tables for pipeline job management and data snapshots

-- Create pipeline_jobs table for tracking individual jobs
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL, -- 'scrape', 'normalize', 'lifespan', 'repost', 'score'
  job_board_id INTEGER REFERENCES job_boards(id),
  board_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_board ON pipeline_jobs(job_board_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_created ON pipeline_jobs(created_at);

-- Create raw_data_snapshots table
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
  data JSONB, -- Raw posting data and statistics
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_board ON raw_data_snapshots(job_board_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON raw_data_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_board_date ON raw_data_snapshots(job_board_id, snapshot_date);

-- Create pipeline_runs table for tracking complete pipeline executions
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'partial', 'failed'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  jobs JSONB[], -- Array of job results
  errors TEXT[], -- Array of error messages
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_start ON pipeline_runs(start_time);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_run_id ON pipeline_runs(run_id);

-- Create view for pipeline statistics
CREATE OR REPLACE VIEW pipeline_stats AS
SELECT
  'all' as period,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_runs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
  ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1) as success_rate,
  SUM(total_jobs) as total_jobs,
  SUM(completed_jobs) as completed_jobs,
  SUM(failed_jobs) as failed_jobs,
  ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time))), 1) as avg_duration_seconds
FROM pipeline_runs
WHERE end_time IS NOT NULL;

-- Create view for daily pipeline schedules
CREATE OR REPLACE VIEW pipeline_schedule AS
SELECT
  DATE(start_time) as run_date,
  COUNT(*) as runs_per_day,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN status != 'completed' THEN 1 END) as failed,
  ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1) as success_rate
FROM pipeline_runs
GROUP BY DATE(start_time)
ORDER BY run_date DESC;

-- Create view for job statistics
CREATE OR REPLACE VIEW pipeline_job_stats AS
SELECT
  job_type,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 1) as success_rate,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM pipeline_jobs
WHERE completed_at IS NOT NULL
GROUP BY job_type;
