-- Migration: Create table for app submissions (Build the Damn Thing)
-- Purpose: Store data from generated apps (letters, poems, search results, etc.)
-- This allows apps to persist data across users and enable search functionality

CREATE TABLE IF NOT EXISTS public.app_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- App context
  app_name TEXT NOT NULL,
  app_idea TEXT NOT NULL,
  
  -- Submission data from user
  name TEXT NOT NULL,              -- "Grandparent Name" or similar
  location TEXT,                    -- "City, State" or location
  submission_type TEXT,             -- "letter", "poem", "message", etc.
  content TEXT NOT NULL,            -- The actual letter/poem/message
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexing for search
  search_name TEXT GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
  search_location TEXT GENERATED ALWAYS AS (LOWER(TRIM(COALESCE(location, '')))) STORED
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_app_submissions_app_name 
  ON public.app_submissions(app_name);

CREATE INDEX IF NOT EXISTS idx_app_submissions_search_name 
  ON public.app_submissions(search_name);

CREATE INDEX IF NOT EXISTS idx_app_submissions_search_location 
  ON public.app_submissions(search_location);

CREATE INDEX IF NOT EXISTS idx_app_submissions_type 
  ON public.app_submissions(submission_type);

CREATE INDEX IF NOT EXISTS idx_app_submissions_created 
  ON public.app_submissions(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.app_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "allow_public_read_submissions" ON public.app_submissions;
DROP POLICY IF EXISTS "allow_public_insert_submissions" ON public.app_submissions;
DROP POLICY IF EXISTS "prevent_delete_submissions" ON public.app_submissions;
DROP POLICY IF EXISTS "prevent_update_submissions" ON public.app_submissions;

-- Allow anyone to READ submissions (public)
CREATE POLICY "allow_public_read_submissions" ON public.app_submissions
  FOR SELECT USING (true);

-- Allow anyone to INSERT submissions (public apps should be able to save)
CREATE POLICY "allow_public_insert_submissions" ON public.app_submissions
  FOR INSERT WITH CHECK (true);

-- Prevent deletion and updates (immutable records)
CREATE POLICY "prevent_delete_submissions" ON public.app_submissions
  FOR DELETE USING (false);

CREATE POLICY "prevent_update_submissions" ON public.app_submissions
  FOR UPDATE USING (false);

-- Grant permissions
GRANT SELECT, INSERT ON public.app_submissions TO anon;
GRANT SELECT, INSERT ON public.app_submissions TO authenticated;
