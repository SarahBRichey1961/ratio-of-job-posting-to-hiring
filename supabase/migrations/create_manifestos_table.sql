-- Create a manifestos table that tracks ownership
CREATE TABLE IF NOT EXISTS manifestos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  questions_data JSONB,
  title TEXT,
  slug TEXT,
  published BOOLEAN DEFAULT false,
  public_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manifestos_user_id ON manifestos(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestos_slug ON manifestos(slug);

-- Enable RLS (Row Level Security)
ALTER TABLE manifestos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own manifestos
CREATE POLICY "Users can view own manifestos"
  ON manifestos FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own manifestos
CREATE POLICY "Users can create own manifestos"
  ON manifestos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own manifestos
CREATE POLICY "Users can update own manifestos"
  ON manifestos FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own manifestos
CREATE POLICY "Users can delete own manifestos"
  ON manifestos FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read access to published manifestos
CREATE POLICY "Public can view published manifestos"
  ON manifestos FOR SELECT
  USING (published = true);
