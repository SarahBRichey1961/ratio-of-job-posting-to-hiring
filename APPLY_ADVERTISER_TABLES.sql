-- APPLY THIS SQL IN SUPABASE DASHBOARD TO CREATE MISSING ADVERTISER TABLES
-- Steps:
-- 1. Go to https://app.supabase.com
-- 2. Select your project (ratio-of-job-posting-to-hiring)
-- 3. Go to SQL Editor
-- 4. Click "New Query"
-- 5. Copy and paste ALL code below
-- 6. Click "Run"

-- Drop existing tables if they exist (START FRESH)
DROP TABLE IF EXISTS ad_clicks CASCADE;
DROP TABLE IF EXISTS ad_impressions CASCADE;
DROP TABLE IF EXISTS advertisements CASCADE;
DROP TABLE IF EXISTS advertiser_accounts CASCADE;
DROP TABLE IF EXISTS sponsor_memberships CASCADE;

-- Sponsor Memberships
CREATE TABLE sponsor_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_sponsor BOOLEAN DEFAULT false,
  sponsor_name VARCHAR(255),
  logo_url VARCHAR(255),
  sponsor_tier VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement Accounts (WITH PAYMENT COLUMNS)
CREATE TABLE advertiser_accounts (
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

-- Advertisements
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

-- Ad Impressions
CREATE TABLE ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  impression_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad Clicks
CREATE TABLE ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  click_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50),
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE sponsor_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertiser_accounts
CREATE POLICY "Users can view their own advertiser account" ON advertiser_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own advertiser account" ON advertiser_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert advertiser account" ON advertiser_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advertisements
CREATE POLICY "Anyone can view active ads" ON advertisements FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Advertisers can insert their own ads" ON advertisements FOR INSERT WITH CHECK (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can update their own ads" ON advertisements FOR UPDATE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can delete their own ads" ON advertisements FOR DELETE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

-- RLS Policies for tracking
CREATE POLICY "Anyone can insert impressions" ON ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad impressions" ON ad_impressions FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

CREATE POLICY "Anyone can insert clicks" ON ad_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad clicks" ON ad_clicks FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

-- Create indexes
CREATE INDEX idx_sponsor_memberships_user_id ON sponsor_memberships(user_id);
CREATE INDEX idx_advertiser_accounts_user_id ON advertiser_accounts(user_id);
CREATE INDEX idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX idx_ad_clicks_ad_id ON ad_clicks(ad_id);

-- Insert Sarah's account with PAID status
INSERT INTO advertiser_accounts (user_id, company_name, website, contact_email, payment_status, subscription_type)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'sarah@websepic.com'),
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

-- Done! Run this query and your tables will be created ✓
