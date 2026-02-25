-- Check how many boards have Product Manager or Product roles
SELECT COUNT(*) as boards_with_product_roles
FROM job_boards
WHERE role_types ILIKE '%product%';

-- List all boards with Product roles
SELECT name, industry, role_types
FROM job_boards
WHERE role_types ILIKE '%product%'
ORDER BY industry, name;

-- Check what roles are in the available roles list
SELECT DISTINCT name FROM job_roles ORDER BY name;
