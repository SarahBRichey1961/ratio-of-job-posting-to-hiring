-- Create table for public/anonymous manifestos
CREATE TABLE IF NOT EXISTS public_manifestos (
  id VARCHAR(12) PRIMARY KEY,
  content TEXT NOT NULL,
  username VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS but allow public reads
ALTER TABLE public_manifestos ENABLE ROW LEVEL SECURITY;

-- Anyone can read public manifestos
CREATE POLICY "Anyone can read public manifestos" ON public_manifestos FOR SELECT USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_manifestos_id ON public_manifestos(id);
CREATE INDEX IF NOT EXISTS idx_public_manifestos_username ON public_manifestos(username) WHERE username IS NOT NULL;
