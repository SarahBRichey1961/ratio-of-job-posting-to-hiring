-- ⚠️ CRITICAL FIX for Campaign Analytics
-- This fixes the root cause: missing UNIQUE constraint on campaign_analytics.campaign_id
-- 
-- WHAT'S BROKEN:
-- - UPSERT on campaign_analytics fails because no UNIQUE constraint exists
-- - This creates duplicate analytics records instead of updating
-- - analytics.ts gets "multiple rows" error and returns 0 recipients
-- - Send endpoint fails with "no recipients"
--
-- HOW TO FIX:
-- 1. Run this SQL in Supabase SQL Editor (https://app.supabase.com/)
-- 2. Select your project
-- 3. Go to SQL Editor > New Query
-- 4. Copy and run these commands:
--
-- ============================================================

-- STEP 1: Remove any duplicate analytics records
-- Keep only the most recent one per campaign_id
DELETE FROM campaign_analytics ca1
WHERE ca1.id NOT IN (
  SELECT DISTINCT ON (ca2.campaign_id) ca2.id
  FROM campaign_analytics ca2
  ORDER BY ca2.campaign_id, ca2.updated_at DESC
);

-- STEP 2: Add the UNIQUE constraint that makes UPSERT work
ALTER TABLE campaign_analytics
ADD CONSTRAINT unique_campaign_analytics_campaign_id UNIQUE(campaign_id);

-- STEP 3: Verify the fix
-- Should return: unique | campaign_id
SELECT constraint_type, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'campaign_analytics' 
AND constraint_name = 'unique_campaign_analytics_campaign_id';

-- ============================================================
-- After running these commands:
-- 1. Recipients endpoint UPSERT will work correctly
-- 2. Analytics will show correct recipient counts
-- 3. Send endpoint will send emails
-- All without any code changes!
