-- Add unique constraint on slug for manifestos table
-- This allows upsert operations to work properly by identifying duplicates
ALTER TABLE manifestos
ADD CONSTRAINT unique_manifesto_slug UNIQUE(slug);

-- Create index for the constraint
CREATE INDEX IF NOT EXISTS idx_manifestos_slug_unique ON manifestos(slug);
