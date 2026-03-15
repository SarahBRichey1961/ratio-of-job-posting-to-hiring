-- INSERT TEST AD - SIMPLE AND FOOLPROOF
-- This script creates a working advertiser account and test ad

-- IMPORTANT: Run queries one at a time in Supabase SQL Editor

-- =============================================
-- STEP 1: Check what users exist in your system
-- =============================================
SELECT id, email FROM auth.users LIMIT 10;

-- =============================================
-- STEP 2: Check existing advertiser accounts
-- =============================================
SELECT id, user_id, company_name, payment_status FROM advertiser_accounts LIMIT 10;

-- =============================================
-- STEP 3: Delete any incomplete advertiser accounts (if needed to start fresh)
-- =============================================
-- DELETE FROM advertiser_accounts WHERE company_name IS NULL;

-- =============================================
-- STEP 4: Create advertiser account for the FIRST user in auth.users
-- This will auto-link to any existing user without breaking FK constraints
-- =============================================
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
SELECT
  u.id,
  'Test Advertiser',
  'https://example.com',
  u.email,
  'paid',
  'premium',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM advertiser_accounts aa WHERE aa.user_id = u.id
)
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
  company_name = 'Test Advertiser',
  payment_status = 'paid',
  updated_at = CURRENT_TIMESTAMP;

-- =============================================
-- STEP 5: Verify advertiser account was created
-- =============================================
SELECT id, user_id, company_name, payment_status FROM advertiser_accounts;

-- =============================================
-- STEP 6: Create a test ad 
-- Uses the first available advertiser account
-- =============================================
INSERT INTO advertisements (
  advertiser_id,
  title,
  description,
  banner_image_url,
  banner_height,
  click_url,
  alt_text,
  is_active,
  impressions,
  clicks,
  created_at,
  updated_at
)
SELECT
  aa.id,
  'Welcome to WebSepic - Job Analytics Platform',
  'Discover trends in job postings and hiring patterns. Track industry insights in real time.',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=80&fit=crop',
  80,
  'https://websepic.com',
  'WebSepic Platform',
  true,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM advertiser_accounts aa
WHERE NOT EXISTS (
  SELECT 1 FROM advertisements a 
  WHERE a.advertiser_id = aa.id AND a.title = 'Welcome to WebSepic - Job Analytics Platform'
)
LIMIT 1;

-- =============================================
-- STEP 7: Verify the test ad was created
-- =============================================
SELECT id, title, advertiser_id, is_active, created_at FROM advertisements;

-- =============================================
-- STEP 8: Count active ads (should be > 0 for ads to display)
-- =============================================
SELECT COUNT(*) as active_ada_count FROM advertisements WHERE is_active = true;
