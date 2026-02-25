-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check your data
-- ============================================================================

-- 1. Check total boards
SELECT COUNT(*) as total_boards FROM job_boards;

-- 2. Check boards by industry
SELECT industry, COUNT(*) as board_count 
FROM job_boards 
WHERE industry IS NOT NULL 
GROUP BY industry 
ORDER BY board_count DESC;

-- 3. Check Technology boards
SELECT name, category, industry, role_types
FROM job_boards 
WHERE industry = 'Technology' 
ORDER BY name;

-- 4. Check if job_roles exist
SELECT COUNT(*) as total_roles FROM job_roles;

-- 5. Check if job_board_roles junction table exists and has data
SELECT COUNT(*) as role_board_links FROM job_board_roles;

-- 6. Sample role-board relationships
SELECT 
  jb.name as board_name,
  jr.name as role_name
FROM job_board_roles jbr
JOIN job_boards jb ON jbr.job_board_id = jb.id
JOIN job_roles jr ON jbr.job_role_id = jr.id
LIMIT 20;
