-- ============================================================
-- FIX VARCHAR LENGTH ERRORS IN advertisements TABLE
-- Run this on: eikhrkharihagaorqqcf.supabase.co
-- ============================================================

-- Increase URL column sizes from 500 to 2000 characters
ALTER TABLE advertisements 
ALTER COLUMN banner_image_url TYPE VARCHAR(2000),
ALTER COLUMN click_url TYPE VARCHAR(2000);

-- Also increase title and description if needed
ALTER TABLE advertisements 
ALTER COLUMN title TYPE VARCHAR(500),
ALTER COLUMN description TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'advertisements' 
AND column_name IN ('banner_image_url', 'click_url', 'title', 'description')
ORDER BY column_name;
