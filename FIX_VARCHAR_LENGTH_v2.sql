-- ============================================================
-- FIX VARCHAR LENGTH ERRORS - USE TEXT FOR UNLIMITED SIZE
-- Run this on: eikhrkharihagaorqqcf.supabase.co
-- ============================================================

-- Change URL columns to TEXT (unlimited length)
ALTER TABLE advertisements 
ALTER COLUMN banner_image_url TYPE TEXT,
ALTER COLUMN click_url TYPE TEXT,
ALTER COLUMN alt_text TYPE TEXT,
ALTER COLUMN title TYPE TEXT,
ALTER COLUMN description TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'advertisements' 
ORDER BY column_name;
