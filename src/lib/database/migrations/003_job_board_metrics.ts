/**
 * Database migration for job board metrics
 * This file contains migrations to set up tables for storing real job board data
 */

export const jobBoardMetricsMigration = `
-- Table to store job board metrics collected from scrapers
CREATE TABLE IF NOT EXISTS job_board_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  total_postings INTEGER,
  avg_lifespan_days INTEGER,
  response_rate DECIMAL,
  acceptance_rate DECIMAL,
  data_source TEXT, -- 'api', 'scraping', 'estimate'
  collected_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_name, collected_date::date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_board_metrics_board_name 
  ON job_board_metrics(board_name);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_collected_date 
  ON job_board_metrics(collected_date DESC);

-- Table to store historical data for trends
CREATE TABLE IF NOT EXISTS job_board_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  metric_date DATE NOT NULL,
  total_postings INTEGER,
  avg_lifespan_days INTEGER,
  response_rate DECIMAL,
  acceptance_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_name, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_history_board_name 
  ON job_board_metrics_history(board_name);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_history_date 
  ON job_board_metrics_history(metric_date DESC);
`
