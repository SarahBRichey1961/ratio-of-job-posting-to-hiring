-- CREATE OTHER MONETIZATION TABLES

-- 1. advertisements table
DROP TABLE IF EXISTS advertisements CASCADE;
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image_url VARCHAR(500) NOT NULL,
  banner_height INT DEFAULT 80,
  click_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active ads" ON advertisements;
CREATE POLICY "Anyone can view active ads" ON advertisements 
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "Advertisers can insert their own ads" ON advertisements;
CREATE POLICY "Advertisers can insert their own ads" ON advertisements 
  FOR INSERT WITH CHECK (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Advertisers can update their own ads" ON advertisements;
CREATE POLICY "Advertisers can update their own ads" ON advertisements 
  FOR UPDATE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Advertisers can delete their own ads" ON advertisements;
CREATE POLICY "Advertisers can delete their own ads" ON advertisements 
  FOR DELETE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

CREATE INDEX idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);

--- 2. ad_impressions table
DROP TABLE IF EXISTS ad_impressions CASCADE;
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  impression_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert impressions" ON ad_impressions;
CREATE POLICY "Anyone can insert impressions" ON ad_impressions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Advertisers can view their own ad impressions" ON ad_impressions;
CREATE POLICY "Advertisers can view their own ad impressions" ON ad_impressions 
  FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

CREATE INDEX idx_ad_impressions_ad_id ON ad_impressions(ad_id);

--- 3. ad_clicks table
DROP TABLE IF EXISTS ad_clicks CASCADE;
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert clicks" ON ad_clicks;
CREATE POLICY "Anyone can insert clicks" ON ad_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Advertisers can view their own ad clicks" ON ad_clicks;
CREATE POLICY "Advertisers can view their own ad clicks" ON ad_clicks 
  FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

CREATE INDEX idx_ad_clicks_ad_id ON ad_clicks(ad_id);

-- Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('advertiser_accounts', 'advertisements', 'ad_impressions', 'ad_clicks') ORDER BY tablename;
