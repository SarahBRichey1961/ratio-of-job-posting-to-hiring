-- Ensure technologies_used column exists in hub_projects table
ALTER TABLE hub_projects 
ADD COLUMN IF NOT EXISTS technologies_used TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hub_projects' 
AND column_name IN ('learning_goals', 'technologies_used');
