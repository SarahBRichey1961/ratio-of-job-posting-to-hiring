-- CHECK SPONSORS IN DATABASE

-- Step 1: Count total sponsors
SELECT COUNT(*) as total_sponsors FROM sponsor_memberships;

-- Step 2: Count active sponsors (is_sponsor = true)
SELECT COUNT(*) as active_sponsors FROM sponsor_memberships WHERE is_sponsor = true;

-- Step 3: View all sponsors with details
SELECT 
  id,
  user_id,
  sponsor_name,
  logo_url,
  sponsor_tier,
  is_sponsor,
  created_at,
  updated_at
FROM sponsor_memberships
ORDER BY created_at DESC;

-- Step 4: Count sponsors by tier
SELECT 
  sponsor_tier,
  COUNT(*) as count,
  SUM(CASE WHEN is_sponsor = true THEN 1 ELSE 0 END) as active_count
FROM sponsor_memberships
GROUP BY sponsor_tier;

-- Step 5: Get sponsors with their user emails (requires joining with auth.users)
SELECT 
  sm.id,
  sm.sponsor_name,
  sm.sponsor_tier,
  sm.is_sponsor,
  sm.created_at,
  COALESCE(au.email, 'Unknown') as user_email
FROM sponsor_memberships sm
LEFT JOIN auth.users au ON sm.user_id = au.id
ORDER BY sm.created_at DESC;
