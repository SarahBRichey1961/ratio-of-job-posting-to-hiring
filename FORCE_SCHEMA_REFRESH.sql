-- FORCE SUPABASE SCHEMA CACHE REFRESH
-- The PostgREST API caches schema - this forces a refresh

-- Enable RLS back on (which triggers schema cache refresh)
ALTER TABLE advertiser_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Add a comment (triggers schema metadata refresh)
COMMENT ON TABLE advertiser_accounts IS 'Advertiser accounts and payment info';
COMMENT ON TABLE advertisements IS 'Advertisement banners';
COMMENT ON TABLE ad_impressions IS 'Ad impression tracking';
COMMENT ON TABLE ad_clicks IS 'Ad click tracking';

-- Verify
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('advertiser_accounts', 'advertisements', 'ad_impressions', 'ad_clicks')
ORDER BY tablename;
