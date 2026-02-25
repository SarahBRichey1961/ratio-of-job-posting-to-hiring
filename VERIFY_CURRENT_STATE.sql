-- Check current database state
SELECT COUNT(*) as total_boards FROM job_boards;

SELECT industry, COUNT(*) as count 
FROM job_boards 
WHERE industry IS NOT NULL 
GROUP BY industry 
ORDER BY count DESC;

SELECT name, industry, category 
FROM job_boards 
WHERE industry = 'Technology' 
ORDER BY name;

SELECT COUNT(*) as total_roles FROM job_roles;

-- Check if role_types column exists and has data
SELECT COUNT(*) as boards_with_role_types 
FROM job_boards 
WHERE role_types IS NOT NULL AND role_types != '';
