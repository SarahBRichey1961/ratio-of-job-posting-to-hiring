-- Add manifesto field to hub_members table
ALTER TABLE hub_members
ADD COLUMN IF NOT EXISTS manifesto TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hub_members_username_manifesto ON hub_members(username) 
WHERE manifesto IS NOT NULL;
