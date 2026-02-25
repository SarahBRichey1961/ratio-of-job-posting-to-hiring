-- Fix: Add Product Manager role to Indeed board (board_id=16)
-- This ensures Indeed appears when filtering by Product Manager on the comparison page

-- First, check if the Product Manager role exists
SELECT id, name FROM job_roles WHERE name = 'Product Manager';

-- Get the role_id for Product Manager
-- Then insert the link if it doesn't already exist

-- If Product Manager role_id is found, run these:
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT 16, id FROM job_roles WHERE name = 'Product Manager'
ON CONFLICT DO NOTHING;

-- Verify the link was created
SELECT 
  jb.id, 
  jb.name, 
  array_agg(jr.name) as roles
FROM job_boards jb
LEFT JOIN job_board_roles jbr ON jb.id = jbr.job_board_id
LEFT JOIN job_roles jr ON jbr.job_role_id = jr.id
WHERE jb.id = 16
GROUP BY jb.id, jb.name;

-- Expected output: (16, 'Indeed', {Product Manager, Developer, Designer, Manager, Sales})
