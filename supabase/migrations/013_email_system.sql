-- Create email subscribers table
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subscribe_insights BOOLEAN NOT NULL DEFAULT true,
  subscribe_alerts BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT UNIQUE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for email subscriber queries
CREATE INDEX idx_email_subscribers_email 
  ON email_subscribers(email);

CREATE INDEX idx_email_subscribers_verified 
  ON email_subscribers(verified);

CREATE INDEX idx_email_subscribers_insights 
  ON email_subscribers(subscribe_insights)
  WHERE verified = true;

-- Create email send logs table
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  total_recipients INTEGER NOT NULL,
  successful INTEGER NOT NULL,
  failed INTEGER NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for email send logs
CREATE INDEX idx_email_send_logs_action 
  ON email_send_logs(action);

CREATE INDEX idx_email_send_logs_date 
  ON email_send_logs(sent_at DESC);

-- Create email bounce/complaint table for ISP feedback loops
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('permanent', 'temporary', 'complaint')),
  reason TEXT,
  bounced_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for bounce tracking
CREATE INDEX idx_email_bounces_email 
  ON email_bounces(email);

-- Function to automatically unsubscribe hard bounces
CREATE OR REPLACE FUNCTION auto_unsubscribe_bounces()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bounce_type = 'permanent' THEN
    UPDATE email_subscribers
    SET subscribe_insights = false, subscribe_alerts = false
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-unsubscribe permanent bounces
CREATE TRIGGER trigger_auto_unsubscribe_bounces
AFTER INSERT ON email_bounces
FOR EACH ROW
EXECUTE FUNCTION auto_unsubscribe_bounces();
