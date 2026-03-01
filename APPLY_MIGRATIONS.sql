-- ============================================================
-- COMPLETE MIGRATION: User Authentication & Manifesto Tables
-- Apply this to Supabase SQL Editor to set up tables
-- ============================================================

-- ============================================================
-- TABLE 1: user_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE 2: manifestos
-- ============================================================
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

-- Create indexes for manifestos
CREATE INDEX IF NOT EXISTS idx_manifestos_user_id ON manifestos(user_id);
CREATE INDEX IF NOT EXISTS idx_manifestos_slug ON manifestos(slug);

-- Add unique constraint on slug (allows upsert to work)
ALTER TABLE manifestos
ADD CONSTRAINT IF NOT EXISTS unique_manifesto_slug UNIQUE(slug);

-- Enable RLS on manifestos
ALTER TABLE manifestos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manifestos
CREATE POLICY "Users can view own manifestos" ON manifestos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own manifestos" ON manifestos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manifestos" ON manifestos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manifestos" ON manifestos
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published manifestos" ON manifestos
  FOR SELECT
  USING (published = true);

-- ============================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================
-- Check if user_profiles table exists:
-- SELECT COUNT(*) as profile_count FROM user_profiles;

-- Check if manifestos table exists:
-- SELECT COUNT(*) as manifesto_count FROM manifestos;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('user_profiles', 'manifestos');
