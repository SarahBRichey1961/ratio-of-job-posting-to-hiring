-- FAILSAFE: Create advertiser_accounts table  
-- This is the MINIMUM needed to fix the issue

-- First, check what we have
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'advertiser_accounts';

-- Drop if exists (clean slate)
DROP TABLE IF EXISTS advertiser_accounts CASCADE;

-- Create the table fresh
CREATE TABLE advertiser_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL DEFAULT 'Company',
  website VARCHAR(255),
  contact_email VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  subscription_type VARCHAR(50) DEFAULT 'basic',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE advertiser_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own advertiser account" ON advertiser_accounts;
CREATE POLICY "Users can view their own advertiser account" ON advertiser_accounts 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own advertiser account" ON advertiser_accounts;
CREATE POLICY "Users can update their own advertiser account" ON advertiser_accounts 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert advertiser account" ON advertiser_accounts;
CREATE POLICY "Users can insert advertiser account" ON advertiser_accounts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_advertiser_accounts_user_id ON advertiser_accounts(user_id);

-- Now create Sarah's account
INSERT INTO advertiser_accounts (
  user_id,
  company_name,
  website,
  contact_email,
  payment_status,
  subscription_type
)
VALUES (
  '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562',
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

-- Verify
SELECT 'advertiser_accounts table' as check, COUNT(*) as row_count FROM advertiser_accounts;
SELECT user_id, company_name, payment_status, subscription_type FROM advertiser_accounts WHERE contact_email = 'sarah@websepic.com';
