-- TEMPORARILY DISABLE RLS TO TEST IF THAT'S THE ISSUE
-- This will allow the API to query advertiser_accounts without RLS restrictions

ALTER TABLE advertiser_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements DISABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('advertiser_accounts', 'advertisements', 'ad_impressions', 'ad_clicks')
ORDER BY tablename;
