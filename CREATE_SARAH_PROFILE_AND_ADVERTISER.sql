-- CREATE SARAH'S PROFILE AND ADVERTISER ACCOUNT
-- Run this in Supabase SQL Editor

-- Step 1: Get Sarah's user ID from auth.users
-- This query will show her UUID - copy it for the next step
SELECT id, email FROM auth.users WHERE email = 'sarah@websepic.com';

-- Step 2: Once you have Sarah's user ID (the UUID), use it in the INSERT below
-- REPLACE 'YOUR_SARAH_USER_ID_HERE' with the actual UUID from Step 1

-- Create Sarah's user profile if it doesn't exist
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  avatar_url,
  is_admin,
  created_at,
  updated_at
)
VALUES (
  '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562',
  'sarah@websepic.com',
  'Sarah Richey',
  NULL,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  updated_at = CURRENT_TIMESTAMP;

-- Create Sarah's advertiser account with PAID status
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

-- Verify the setup
SELECT 'User Profile' as table_name, COUNT(*) as count FROM user_profiles WHERE email = 'sarah@websepic.com'
UNION ALL
SELECT 'Advertiser Account' as table_name, COUNT(*) as count FROM advertiser_accounts WHERE contact_email = 'sarah@websepic.com';
