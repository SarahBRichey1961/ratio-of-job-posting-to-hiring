-- Sponsor Memberships
CREATE TABLE IF NOT EXISTS sponsor_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_sponsor BOOLEAN DEFAULT false,
  sponsor_name VARCHAR(255),
  logo_url VARCHAR(255),
  sponsor_tier VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement Accounts
CREATE TABLE IF NOT EXISTS advertiser_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  contact_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisements (the actual ads to display)
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_accounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_image_url VARCHAR(500) NOT NULL,
  banner_height INT DEFAULT 80, -- in pixels
  click_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Track ad rotations/displays
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  impression_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  page_type VARCHAR(50), -- 'comparison', 'search', 'hub'
  user_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track ad clicks
CREATE TABLE IF NOT EXISTS ad_clicks (
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

-- RLS Policies for sponsor_memberships
CREATE POLICY "Users can view their own sponsor status" ON sponsor_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own sponsor info" ON sponsor_memberships FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert sponsor membership" ON sponsor_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advertiser_accounts
CREATE POLICY "Users can view their own advertiser account" ON advertiser_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own advertiser account" ON advertiser_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert advertiser account" ON advertiser_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advertisements
CREATE POLICY "Anyone can view active ads" ON advertisements FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Advertisers can insert their own ads" ON advertisements FOR INSERT WITH CHECK (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can update their own ads" ON advertisements FOR UPDATE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Advertisers can delete their own ads" ON advertisements FOR DELETE USING (advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid()));

-- RLS Policies for tracking (public can insert impressions/clicks)
CREATE POLICY "Anyone can insert impressions" ON ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad impressions" ON ad_impressions FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

CREATE POLICY "Anyone can insert clicks" ON ad_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Advertisers can view their own ad clicks" ON ad_clicks FOR SELECT USING (ad_id IN (SELECT id FROM advertisements WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = auth.uid())));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_user_id ON sponsor_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_accounts_user_id ON advertiser_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser_id ON advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad_id ON ad_clicks(ad_id);
