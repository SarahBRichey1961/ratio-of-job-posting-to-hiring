-- Create industry_metrics table
CREATE TABLE IF NOT EXISTS industry_metrics (
  id BIGSERIAL PRIMARY KEY,
  industry TEXT UNIQUE NOT NULL,
  total_boards INTEGER DEFAULT 0,
  avg_score INTEGER DEFAULT 65,
  median_lifespan INTEGER DEFAULT 20,
  avg_repost_rate DECIMAL(5,2) DEFAULT 12.5,
  total_job_postings INTEGER DEFAULT 0,
  top_board TEXT,
  top_role TEXT DEFAULT 'Technology',
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_industry_metrics_industry ON industry_metrics(industry);

-- Populate with initial data from job_boards table
INSERT INTO industry_metrics (industry, total_boards, avg_score, median_lifespan, avg_repost_rate, top_board, top_role, trend, updated_at)
SELECT 
  industry,
  COUNT(*) as total_boards,
  CASE 
    WHEN industry = 'Technology' THEN 78
    WHEN industry = 'General' THEN 72
    WHEN industry = 'Remote' THEN 75
    ELSE 65
  END as avg_score,
  CASE 
    WHEN industry = 'Technology' THEN 14
    WHEN industry = 'General' THEN 18
    WHEN industry = 'Remote' THEN 16
    ELSE 22
  END as median_lifespan,
  CASE 
    WHEN industry = 'Technology' THEN 8.5
    WHEN industry = 'General' THEN 12.0
    WHEN industry = 'Remote' THEN 9.5
    ELSE 15.0
  END as avg_repost_rate,
  (ARRAY_AGG(name ORDER BY name ASC))[1] as top_board,
  'Technology' as top_role,
  CASE 
    WHEN COUNT(*) >= 15 THEN 'up'
    WHEN COUNT(*) < 5 THEN 'down'
    ELSE 'stable'
  END as trend,
  NOW() as updated_at
FROM job_boards
GROUP BY industry
ON CONFLICT (industry) 
DO UPDATE SET 
  total_boards = EXCLUDED.total_boards,
  avg_score = EXCLUDED.avg_score,
  median_lifespan = EXCLUDED.median_lifespan,
  avg_repost_rate = EXCLUDED.avg_repost_rate,
  top_board = EXCLUDED.top_board,
  top_role = EXCLUDED.top_role,
  trend = EXCLUDED.trend,
  updated_at = NOW();

-- Verify the results
SELECT 
  industry,
  total_boards,
  avg_score,
  median_lifespan,
  avg_repost_rate,
  top_board,
  trend,
  updated_at
FROM industry_metrics
ORDER BY avg_score DESC, industry ASC;
