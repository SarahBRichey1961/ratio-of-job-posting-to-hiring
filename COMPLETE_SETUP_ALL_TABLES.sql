-- COMPLETE SETUP: Create all missing tables and Sarah's account
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================================
-- TABLE 1: Create user_profiles (if missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE 2: Create advertiser_accounts (monetization)
-- ============================================================
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

ALTER TABLE advertiser_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_advertiser_accounts_user_id ON advertiser_accounts(user_id);

CREATE POLICY "Users can view their own advertiser account" ON advertiser_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own advertiser account" ON advertiser_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert advertiser account" ON advertiser_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLE 3: Create advertisements
-- ============================================================
CREATE TABLE IF NOT EXISTS advertisements (
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

CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);

CREATE POLICY "Anyone can view active ads" ON advertisements FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Advertisers can insert their own ads" ON advertisements FOR INSERT WITH CHECK (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can update their own ads" ON advertisements FOR UPDATE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can delete their own ads" ON advertisements FOR DELETE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

-- ============================================================
-- TABLE 4: Create ad_impressions
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  impression_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);

CREATE POLICY "Anyone can insert impressions" ON ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad impressions" ON ad_impressions FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

-- ============================================================
-- TABLE 5: Create ad_clicks
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);

CREATE POLICY "Anyone can insert clicks" ON ad_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad clicks" ON ad_clicks FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

-- ============================================================
-- CREATE SARAH'S ACCOUNT (Admin User)
-- ============================================================
INSERT INTO user_profiles (id, email, role, created_at, updated_at)
VALUES (
  '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562',
  'sarah@websepic.com',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO advertiser_accounts (
  user_id,
  company_name,
  website,
  contact_email,
  payment_status,
  subscription_type,
  created_at,
  updated_at
)
VALUES (
  '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562',
  'WebSepic Admin',
  'https://websepic.com',
  'sarah@websepic.com',
  'paid',
  'premium',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
  payment_status = 'paid',
  subscription_type = 'premium',
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- VERIFY SETUP
-- ============================================================
SELECT 'User Profile Created' as status, COUNT(*) as count FROM user_profiles WHERE email = 'sarah@websepic.com'
UNION ALL
SELECT 'Advertiser Account Created' as status, COUNT(*) as count FROM advertiser_accounts WHERE contact_email = 'sarah@websepic.com'
UNION ALL
SELECT 'Tables Created' as status, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'advertiser_accounts', 'advertisements', 'ad_impressions', 'ad_clicks');
