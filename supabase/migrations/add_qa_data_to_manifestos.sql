-- Add Q&A data columns to store questions and answers for editing
ALTER TABLE public_manifestos ADD COLUMN IF NOT EXISTS questions_data JSONB DEFAULT NULL;

-- Add questions_data column to hub_members for authenticated users
ALTER TABLE hub_members ADD COLUMN IF NOT EXISTS manifesto_questions JSONB DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public_manifestos.questions_data IS 'JSON array of questions and answers: [{question, answer}, ...]';
COMMENT ON COLUMN hub_members.manifesto_questions IS 'JSON array of questions and answers: [{question, answer}, ...]';
