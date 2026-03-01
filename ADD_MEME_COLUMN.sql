-- ============================================================
-- MIGRATION: Add Meme Image URL Support to Manifestos
-- Apply this to Supabase SQL Editor
-- ============================================================

ALTER TABLE manifestos 
ADD COLUMN IF NOT EXISTS meme_image_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manifestos_meme ON manifestos(meme_image_url);

-- Verify the column was added
-- SELECT column_name FROM information_schema.columns WHERE table_name='manifestos';
