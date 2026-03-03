-- Add payment tracking columns to sponsor_memberships
ALTER TABLE sponsor_memberships
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add payment tracking columns to advertiser_accounts
ALTER TABLE advertiser_accounts
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Create indexes for payment lookups
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_payment_status ON sponsor_memberships(payment_status);
CREATE INDEX IF NOT EXISTS idx_advertiser_accounts_payment_status ON advertiser_accounts(payment_status);
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_stripe_session ON sponsor_memberships(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_advertiser_accounts_stripe_session ON advertiser_accounts(stripe_session_id);
