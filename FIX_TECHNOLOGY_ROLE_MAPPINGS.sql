-- ============================================================================
-- FIX: Map Technology board roles to actual job_roles entries
-- ============================================================================

-- First, let's see what the job_roles actually contains
SELECT name FROM job_roles ORDER BY name;

-- Now update the Technology boards with corrected role mappings
-- Map various role names to matching job_roles entries

UPDATE job_boards SET role_types = 
  CASE 
    WHEN role_types ILIKE '%Software Engineering%' THEN 'Backend Developer, Frontend Developer, Full Stack Developer, DevOps Engineer'
    WHEN role_types ILIKE '%Data Science%' THEN 'Data Scientist'
    WHEN role_types ILIKE '%Product Management%' OR role_types ILIKE '%Product%' THEN 'Product Manager'
    WHEN role_types ILIKE '%Design%' OR role_types ILIKE '%UX/UI%' THEN 'Designer'
    WHEN role_types ILIKE '%DevOps%' THEN 'DevOps Engineer'
    WHEN role_types ILIKE '%Backend%' THEN 'Backend Developer'
    WHEN role_types ILIKE '%Frontend%' THEN 'Frontend Developer'
    WHEN role_types ILIKE '%Full.Stack%' OR role_types ILIKE '%Full-Stack%' THEN 'Full Stack Developer'
    WHEN role_types ILIKE '%QA%' THEN 'Frontend Developer'
    WHEN role_types ILIKE '%Leadership%' OR role_types ILIKE '%Management%' THEN 'Executive'
    WHEN role_types ILIKE '%Cloud%' OR role_types ILIKE '%Infrastructure%' THEN 'DevOps Engineer'
    WHEN role_types ILIKE '%Security%' OR role_types ILIKE '%Cybersecurity%' THEN 'DevOps Engineer'
    ELSE role_types
  END
WHERE industry = 'Technology';

-- Verify the changes
SELECT name, role_types FROM job_boards WHERE industry = 'Technology' ORDER BY name;

-- Now run the population again to create proper links
DELETE FROM job_board_roles;

INSERT INTO job_board_roles (job_board_id, job_role_id)
WITH role_splits AS (
  SELECT 
    jb.id as board_id,
    TRIM(UNNEST(STRING_TO_ARRAY(jb.role_types, ','))) as role_name
  FROM job_boards jb
  WHERE jb.role_types IS NOT NULL AND jb.role_types != ''
)
SELECT DISTINCT
  rs.board_id,
  jr.id as role_id
FROM role_splits rs
JOIN job_roles jr ON LOWER(rs.role_name) = LOWER(jr.name)
WHERE jr.id IS NOT NULL
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Final verification
SELECT COUNT(*) as total_role_board_links FROM job_board_roles;

SELECT 
  jb.industry,
  jr.name as role,
  COUNT(DISTINCT jbr.job_board_id) as board_count
FROM job_board_roles jbr
JOIN job_boards jb ON jbr.job_board_id = jb.id
JOIN job_roles jr ON jbr.job_role_id = jr.id
GROUP BY jb.industry, jr.name
ORDER BY jb.industry, jr.name;

-- Check if any boards still have no role links
SELECT COUNT(*) as boards_with_no_roles FROM (
  SELECT jb.id FROM job_boards jb
  LEFT JOIN job_board_roles jbr ON jb.id = jbr.job_board_id
  WHERE jbr.job_board_id IS NULL
) x;
