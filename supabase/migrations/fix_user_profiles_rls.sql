-- Fix user_profiles RLS policies
-- Remove problematic recursive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Add simpler INSERT policy
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
