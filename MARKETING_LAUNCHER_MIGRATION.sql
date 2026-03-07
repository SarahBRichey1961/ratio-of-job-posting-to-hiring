-- Marketing Launcher Tables for Email Campaigns

-- Marketing Campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES hub_projects(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email_subject VARCHAR(255) NOT NULL,
  email_body_html TEXT NOT NULL,
  target_audience_segment VARCHAR(50) DEFAULT 'custom', -- 'unemployed', 'hired', 'custom'
  list_source VARCHAR(50) DEFAULT 'imported', -- 'internal', 'hunter', 'linkedin', 'imported'
  estimated_reach INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'completed', 'paused'
  utm_source VARCHAR(100) DEFAULT 'marketing_launcher',
  utm_medium VARCHAR(50) DEFAULT 'email',
  utm_campaign VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Recipients table (tracks who receives the email)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  target_role VARCHAR(100),
  target_industry VARCHAR(100),
  tracking_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'bounced', 'opened', 'clicked', 'converted'
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  converted_at TIMESTAMP,
  ga_session_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, email)
);

-- Campaign Performance Analytics
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  click_through_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_campaigns
DROP POLICY IF EXISTS "Users can view own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can view own campaigns" ON marketing_campaigns
  FOR SELECT USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create campaigns" ON marketing_campaigns;
CREATE POLICY "Users can create campaigns" ON marketing_campaigns
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can update own campaigns" ON marketing_campaigns
  FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own campaigns" ON marketing_campaigns;
CREATE POLICY "Users can delete own campaigns" ON marketing_campaigns
  FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for campaign_recipients
DROP POLICY IF EXISTS "Users can view recipients of own campaigns" ON campaign_recipients;
CREATE POLICY "Users can view recipients of own campaigns" ON campaign_recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_campaigns
      WHERE marketing_campaigns.id = campaign_recipients.campaign_id
      AND marketing_campaigns.creator_id = auth.uid()
    )
  );

-- RLS Policies for campaign_analytics
DROP POLICY IF EXISTS "Users can view analytics of own campaigns" ON campaign_analytics;
CREATE POLICY "Users can view analytics of own campaigns" ON campaign_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM marketing_campaigns
      WHERE marketing_campaigns.id = campaign_analytics.campaign_id
      AND marketing_campaigns.creator_id = auth.uid()
    )
  );

-- Create indexes for better query performance
DROP INDEX IF EXISTS idx_marketing_campaigns_creator;
CREATE INDEX idx_marketing_campaigns_creator ON marketing_campaigns(creator_id);
DROP INDEX IF EXISTS idx_marketing_campaigns_status;
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
DROP INDEX IF EXISTS idx_campaign_recipients_campaign;
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
DROP INDEX IF EXISTS idx_campaign_recipients_status;
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status);
DROP INDEX IF EXISTS idx_campaign_analytics_campaign;
CREATE INDEX idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
