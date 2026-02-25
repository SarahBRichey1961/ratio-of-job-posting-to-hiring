-- Create table for storing job board scrape results
CREATE TABLE IF NOT EXISTS job_board_scrape_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id INTEGER NOT NULL,
  board_name TEXT NOT NULL,
  job_count INTEGER NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_board_id FOREIGN KEY (board_id) REFERENCES fallback_boards(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_board_scrape_board_id ON job_board_scrape_results(board_id);
CREATE INDEX IF NOT EXISTS idx_job_board_scrape_scraped_at ON job_board_scrape_results(scraped_at);
CREATE INDEX IF NOT EXISTS idx_job_board_scrape_created_at ON job_board_scrape_results(created_at);

-- Create view for latest scrape per board
CREATE OR REPLACE VIEW latest_job_counts AS
SELECT DISTINCT ON (board_id)
  board_id,
  board_name,
  job_count,
  scraped_at,
  success,
  error_message
FROM job_board_scrape_results
ORDER BY board_id, scraped_at DESC;

-- Enable RLS (optional, for row-level security)
ALTER TABLE job_board_scrape_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert
CREATE POLICY "Allow service role insert" ON job_board_scrape_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow public read
CREATE POLICY "Allow public read" ON job_board_scrape_results
  FOR SELECT
  USING (true);
