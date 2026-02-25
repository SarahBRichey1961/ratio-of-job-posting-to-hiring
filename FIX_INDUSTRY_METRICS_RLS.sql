-- Fix RLS (Row Level Security) for industry_metrics table
-- This allows public/anonymous read access to the metrics

-- Disable RLS on industry_metrics table (if it's causing issues)
ALTER TABLE industry_metrics DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, add a public read policy:
-- CREATE POLICY "Allow public read access" 
-- ON industry_metrics 
-- FOR SELECT 
-- TO anon, authenticated 
-- USING (true);

-- Verify the table is accessible
SELECT COUNT(*) as total_industries FROM industry_metrics;
