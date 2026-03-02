-- ============================================================
-- MIGRATION: Add Meme Image URL Support to Public Manifestos
-- Apply this to Supabase SQL Editor
-- ============================================================

ALTER TABLE public_manifestos 
ADD COLUMN IF NOT EXISTS meme_image_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_public_manifestos_meme ON public_manifestos(meme_image_url);

-- Verify the columns were added
-- SELECT column_name FROM information_schema.columns WHERE table_name='public_manifestos' ORDER BY ordinal_position;
