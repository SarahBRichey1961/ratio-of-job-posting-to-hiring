-- Check the 3 test ads you created
SELECT 
  a.id,
  a.title,
  a.is_active,
  a.banner_image_url,
  a.click_url,
  a.banner_height,
  a.expires_at,
  a.created_at,
  CASE 
    WHEN a.banner_image_url IS NULL THEN '❌ MISSING banner_image_url'
    WHEN a.click_url IS NULL THEN '❌ MISSING click_url'
    WHEN a.banner_image_url = '' THEN '⚠️ EMPTY banner_image_url'
    WHEN a.click_url = '' THEN '⚠️ EMPTY click_url'
    ELSE '✅ Has both URLs'
  END as ad_status
FROM advertisements a
ORDER BY a.created_at DESC
LIMIT 10;
