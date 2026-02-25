-- Create industry_metrics table to store calculated insights
CREATE TABLE IF NOT EXISTS industry_metrics (
  id BIGSERIAL PRIMARY KEY,
  industry TEXT UNIQUE NOT NULL,
  total_boards INTEGER DEFAULT 0,
  avg_score INTEGER DEFAULT 0,
  median_lifespan INTEGER DEFAULT 0,
  avg_repost_rate INTEGER DEFAULT 0,
  total_job_postings INTEGER DEFAULT 0,
  top_board TEXT,
  top_role TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_industry_metrics_industry ON industry_metrics(industry);

-- Populate initial metrics from existing board data
INSERT INTO industry_metrics (industry, total_boards, avg_score, median_lifespan, avg_repost_rate, total_job_postings, top_board, top_role, trend, updated_at)
SELECT 
  industry,
  COUNT(DISTINCT id) as total_boards,
  COALESCE(ROUND(AVG(COALESCE(score, 0))), 0) as avg_score,
  COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY COALESCE(lifespan, 0)), 0)::INTEGER as median_lifespan,
  COALESCE(ROUND(AVG(COALESCE(repost_rate, 0))), 0) as avg_repost_rate,
  COALESCE(SUM(COALESCE(total_postings, 0)), 0) as total_job_postings,
  (ARRAY_AGG(name ORDER BY COALESCE(score, 0) DESC))[1] as top_board,
  'Technology' as top_role,
  CASE 
    WHEN COALESCE(ROUND(AVG(COALESCE(score, 0))), 0) >= 75 THEN 'up'
    WHEN COALESCE(ROUND(AVG(COALESCE(score, 0))), 0) < 50 THEN 'down'
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
  total_job_postings = EXCLUDED.total_job_postings,
  top_board = EXCLUDED.top_board,
  top_role = EXCLUDED.top_role,
  trend = EXCLUDED.trend,
  updated_at = NOW();

-- Verify results
SELECT 
  industry,
  total_boards,
  avg_score,
  median_lifespan,
  avg_repost_rate,
  total_job_postings,
  top_board,
  trend,
  updated_at
FROM industry_metrics
ORDER BY avg_score DESC;
