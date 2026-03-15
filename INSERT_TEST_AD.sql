-- INSERT TEST AD FOR SARAH
-- This script creates a test advertisement to enable ads display on pages

-- Step 0: Find existing users in auth.users table
-- You'll need to use one of these user IDs for the advertiser account
SELECT id, email FROM auth.users LIMIT 10;

-- Step 1: Check if any advertiser accounts already exist
SELECT id, user_id, company_name, payment_status FROM advertiser_accounts LIMIT 5;

-- Step 2: Create advertiser account for the first available user
-- Replace 'YOUR_USER_ID_HERE' with an actual user_id from auth.users
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
  'WebSepic Admin',
  'https://websepic.com',
  u.email,
  'paid',
  'premium',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM advertiser_accounts WHERE user_id = u.id
)
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET
  company_name = 'WebSepic Admin',
  website = 'https://websepic.com',
  payment_status = 'paid',
  subscription_type = 'premium',
  updated_at = CURRENT_TIMESTAMP;

-- Step 3: Verify advertiser account was created
SELECT id, user_id, company_name, payment_status FROM advertiser_accounts LIMIT 1;

-- Step 4: Create a test ad using the first available advertiser account
WITH first_advertiser AS (
  SELECT id FROM advertiser_accounts LIMIT 1
)
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
  fa.id,
  'WebSepic - Your Job Analytics Platform',
  'Discover trends in job postings and hiring patterns. Track industry insights in real time.',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=80&fit=crop',
  80,
  'https://websepic.com',
  'WebSepic platform banner',
  true,
  0,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM first_advertiser fa
WHERE NOT EXISTS (
  SELECT 1 FROM advertisements 
  WHERE advertiser_id = fa.id AND title = 'WebSepic - Your Job Analytics Platform'
);

-- Step 5: Verify the ad was created
SELECT id, title, advertiser_id, is_active, created_at FROM advertisements WHERE is_active = true;

-- Step 6: Count total active ads
SELECT COUNT(*) as total_active_ads FROM advertisements WHERE is_active = true;
