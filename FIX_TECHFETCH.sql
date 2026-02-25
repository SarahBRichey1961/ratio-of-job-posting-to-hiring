-- Fix TechFetch roles to match job_roles table
UPDATE job_boards
SET role_types = 'Backend Developer, DevOps Engineer, Full Stack Developer'
WHERE id = 172;  -- TechFetch

-- Verify the update
SELECT id, name, role_types FROM job_boards WHERE id = 172;

-- Now create the missing link
INSERT INTO job_board_roles (job_board_id, job_role_id)
WITH role_splits AS (
  SELECT 
    jb.id as board_id,
    TRIM(UNNEST(STRING_TO_ARRAY(jb.role_types, ','))) as role_name
  FROM job_boards jb
  WHERE jb.id = 172
)
SELECT DISTINCT
  rs.board_id,
  jr.id as role_id
FROM role_splits rs
JOIN job_roles jr ON LOWER(rs.role_name) = LOWER(jr.name)
WHERE jr.id IS NOT NULL
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Final verification - check all unlinked boards
SELECT COUNT(*) as boards_with_no_roles FROM (
  SELECT jb.id FROM job_boards jb
  LEFT JOIN job_board_roles jbr ON jb.id = jbr.job_board_id
  WHERE jbr.job_board_id IS NULL
) x;

-- Show total role-board links
SELECT COUNT(*) as total_role_board_links FROM job_board_roles;
