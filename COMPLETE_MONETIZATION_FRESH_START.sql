-- ============================================================
-- COMPLETE MONETIZATION SETUP FOR CORRECT PROJECT
-- Run this ENTIRE script on: eikhrkharihagaorqqcf.supabase.co
-- ============================================================

-- 1. CREATE advertiser_accounts TABLE
CREATE TABLE IF NOT EXISTS advertiser_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  contact_email VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  subscription_type VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE advertiser_accounts DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_advertiser_accounts_user_id ON advertiser_accounts(user_id);
GRANT ALL PRIVILEGES ON advertiser_accounts TO postgres, anon, authenticated, service_role;

-- 2. CREATE advertisements TABLE
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  banner_image_url TEXT NOT NULL,
  banner_height INT DEFAULT 80,
  click_url TEXT NOT NULL,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

ALTER TABLE advertisements DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);
GRANT ALL PRIVILEGES ON advertisements TO postgres, anon, authenticated, service_role;

-- 3. CREATE ad_impressions TABLE
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  impression_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_impressions DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
GRANT ALL PRIVILEGES ON ad_impressions TO postgres, anon, authenticated, service_role;

-- 4. CREATE ad_clicks TABLE
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_clicks DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
GRANT ALL PRIVILEGES ON ad_clicks TO postgres, anon, authenticated, service_role;

-- 5. INSERT SARAH'S ACCOUNT (PAID STATUS)
INSERT INTO advertiser_accounts (
  user_id,
  company_name,
  website,
  contact_email,
  payment_status,
  subscription_type
)
VALUES (
  'ca8848c4-d227-4e7c-80e2-5503d41b8f10',
  'WebSepic Admin',
  'https://websepic.com',
  'sarah@websepic.com',
  'paid',
  'premium'
)
ON CONFLICT (user_id) DO UPDATE SET
  payment_status = 'paid',
  subscription_type = 'premium',
  updated_at = CURRENT_TIMESTAMP;

-- 6. VERIFY EVERYTHING
SELECT 'Advertiser Accounts' as table_name, COUNT(*) as row_count FROM advertiser_accounts
UNION ALL
SELECT 'Advertisements' as table_name, COUNT(*) as row_count FROM advertisements
UNION ALL
SELECT 'Ad Impressions' as table_name, COUNT(*) as row_count FROM ad_impressions
UNION ALL
SELECT 'Ad Clicks' as table_name, COUNT(*) as row_count FROM ad_clicks;

-- Verify Sarah's account
SELECT user_id, company_name, payment_status, subscription_type FROM advertiser_accounts WHERE contact_email = 'sarah@websepic.com';
