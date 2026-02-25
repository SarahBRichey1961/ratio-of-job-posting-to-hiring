-- ============================================================================
-- STEP 1: VERIFY - Show all unique role/industry combinations in job boards
-- ============================================================================
WITH role_splits AS (
  SELECT 
    jb.id as board_id,
    jb.name as board_name,
    jb.industry,
    TRIM(UNNEST(STRING_TO_ARRAY(jb.role_types, ','))) as role_name
  FROM job_boards jb
  WHERE jb.role_types IS NOT NULL AND jb.role_types != ''
)
SELECT
  rs.industry,
  rs.role_name,
  COUNT(DISTINCT rs.board_id) as board_count
FROM role_splits rs
GROUP BY rs.industry, rs.role_name
ORDER BY rs.industry, rs.role_name;

-- ============================================================================
-- STEP 2: VERIFY - Show roles that don't match job_roles table
-- ============================================================================
WITH role_splits AS (
  SELECT 
    jb.id as board_id,
    jb.name as board_name,
    jb.industry,
    TRIM(UNNEST(STRING_TO_ARRAY(jb.role_types, ','))) as role_name
  FROM job_boards jb
  WHERE jb.role_types IS NOT NULL AND jb.role_types != ''
)
SELECT
  rs.role_name,
  rs.industry,
  COUNT(DISTINCT rs.board_id) as board_count
FROM role_splits rs
LEFT JOIN job_roles jr ON LOWER(rs.role_name) = LOWER(jr.name)
WHERE jr.id IS NULL
GROUP BY rs.role_name, rs.industry
ORDER BY rs.role_name;

-- ============================================================================
-- STEP 3: POPULATE job_board_roles junction table correctly
-- ============================================================================
-- First clear existing links
DELETE FROM job_board_roles;

-- Then insert correct links by matching role_types text with job_roles names
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

-- ============================================================================
-- STEP 4: VERIFY - Show what was populated
-- ============================================================================
SELECT 
  jb.industry,
  jr.name as role,
  COUNT(DISTINCT jbr.job_board_id) as board_count
FROM job_board_roles jbr
JOIN job_boards jb ON jbr.job_board_id = jb.id
JOIN job_roles jr ON jbr.job_role_id = jr.id
GROUP BY jb.industry, jr.name
ORDER BY jb.industry, jr.name;

-- ============================================================================
-- STEP 5: Count total links created
-- ============================================================================
SELECT COUNT(*) as total_role_board_links FROM job_board_roles;

-- Show which boards have no role links (these need manual attention)
SELECT jb.id, jb.name, jb.industry, jb.role_types
FROM job_boards jb
LEFT JOIN job_board_roles jbr ON jb.id = jbr.job_board_id
WHERE jbr.job_board_id IS NULL
ORDER BY jb.industry, jb.name;
