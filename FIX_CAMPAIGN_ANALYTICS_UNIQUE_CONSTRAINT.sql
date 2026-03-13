-- STEP 1: Remove any duplicate analytics records
DELETE FROM campaign_analytics ca1
WHERE ca1.id NOT IN (
  SELECT DISTINCT ON (ca2.campaign_id) ca2.id
  FROM campaign_analytics ca2
  ORDER BY ca2.campaign_id, ca2.updated_at DESC
);

-- STEP 2: Add the UNIQUE constraint
-- Run this as a separate query if first one succeeds
ALTER TABLE campaign_analytics
ADD CONSTRAINT unique_campaign_analytics_campaign_id UNIQUE(campaign_id);
