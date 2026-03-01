-- Add INSERT policy to user_profiles to allow users to create their profile
CREATE POLICY "Users can create own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
