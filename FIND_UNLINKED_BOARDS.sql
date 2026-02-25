-- Find boards with no role links
SELECT jb.id, jb.name, jb.industry, jb.role_types
FROM job_boards jb
LEFT JOIN job_board_roles jbr ON jb.id = jbr.job_board_id
WHERE jbr.job_board_id IS NULL
ORDER BY jb.name;
