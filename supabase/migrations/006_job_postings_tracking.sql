-- Create table for storing individual job postings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id INTEGER NOT NULL,
  board_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  company_name TEXT,
  posted_date DATE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_board_id FOREIGN KEY (board_id) REFERENCES fallback_boards(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_job_postings_board_id ON job_postings(board_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_date ON job_postings(posted_date);
CREATE INDEX IF NOT EXISTS idx_job_postings_scraped_at ON job_postings(scraped_at);
CREATE INDEX IF NOT EXISTS idx_job_postings_board_date ON job_postings(board_id, posted_date);

-- Create view for today's job postings per board
CREATE OR REPLACE VIEW today_job_postings AS
SELECT 
  board_id,
  board_name,
  COUNT(*) as job_count,
  CURRENT_DATE as posting_date
FROM job_postings
WHERE posted_date = CURRENT_DATE
GROUP BY board_id, board_name;

-- Create view for jobs posted in last 24 hours
CREATE OR REPLACE VIEW recent_job_postings AS
SELECT 
  board_id,
  board_name,
  COUNT(*) as job_count,
  MAX(posted_at) as latest_posting
FROM job_postings
WHERE posted_at > NOW() - INTERVAL '24 hours'
GROUP BY board_id, board_name;

-- Enable RLS (optional, for row-level security)
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert
CREATE POLICY "Allow service role insert" ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow public read
CREATE POLICY "Allow public read" ON job_postings
  FOR SELECT
  USING (true);
