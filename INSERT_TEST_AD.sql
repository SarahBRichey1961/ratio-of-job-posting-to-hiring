-- INSERT TEST AD FOR SARAH
-- This script creates a test advertisement for Sarah's account so ads display on pages

-- Step 1: Get Sarah's advertiser account ID
SELECT id, user_id, company_name, payment_status FROM advertiser_accounts 
WHERE user_id = '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562';

-- Step 2: Create a test ad
-- Use Sarah's advertiser_id from Step 1
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
VALUES (
  (SELECT id FROM advertiser_accounts WHERE user_id = '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562' LIMIT 1),
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
)
ON CONFLICT DO NOTHING;

-- Step 3: Verify the ad was created
SELECT id, title, advertiser_id, is_active, created_at FROM advertisements 
WHERE advertiser_id = (SELECT id FROM advertiser_accounts WHERE user_id = '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562' LIMIT 1);

-- Step 4: Count total active ads
SELECT COUNT(*) as total_active_ads FROM advertisements WHERE is_active = true;
