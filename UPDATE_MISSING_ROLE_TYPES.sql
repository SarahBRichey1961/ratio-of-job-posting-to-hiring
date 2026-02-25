-- ============================================================================
-- POPULATE role_types for boards that are missing them (non-Technology boards)
-- ============================================================================

-- Construction & Skilled Trades
UPDATE job_boards 
SET role_types = 'Construction Worker'
WHERE industry = 'Construction' AND role_types IS NULL;

-- Transportation & Logistics
UPDATE job_boards
SET role_types = 'Truck Driver'
WHERE industry = 'Transportation & Logistics' AND role_types IS NULL;

-- Retail & Hospitality
UPDATE job_boards
SET role_types = 'Retail, Sales, Operations'
WHERE industry = 'Retail & Hospitality' AND role_types IS NULL;

-- Creative & Media
UPDATE job_boards
SET role_types = 'Designer, Marketing'
WHERE industry = 'Creative & Media' AND role_types IS NULL;

-- Science & Biotech
UPDATE job_boards
SET role_types = 'Scientist'
WHERE industry = 'Science & Biotech' AND role_types IS NULL;

-- Education
UPDATE job_boards
SET role_types = 'Teacher'
WHERE industry = 'Education' AND role_types IS NULL;

-- Government
UPDATE job_boards
SET role_types = 'Executive, Operations'
WHERE industry = 'Government' AND role_types IS NULL;

-- Finance & Accounting
UPDATE job_boards
SET role_types = 'Accountant'
WHERE industry = 'Finance & Accounting' AND role_types IS NULL;

-- Legal
UPDATE job_boards
SET role_types = 'Lawyer'
WHERE industry = 'Legal' AND role_types IS NULL;

-- Manufacturing
UPDATE job_boards
SET role_types = 'Manufacturer'
WHERE industry = 'Manufacturing' AND role_types IS NULL;

-- Remote (cross-industry - include common roles)
UPDATE job_boards
SET role_types = 'Backend Developer, Frontend Developer, Full Stack Developer, Data Scientist, DevOps Engineer, Product Manager'
WHERE industry = 'Remote' AND role_types IS NULL;

-- General (catch-all - include all major roles)
UPDATE job_boards
SET role_types = 'Software Engineer, Data Scientist, Product Manager, Marketing, Sales, Operations, Executive, Designer'
WHERE industry = 'General' AND role_types IS NULL;

-- ============================================================================
-- VERIFY: Show all boards now have role_types
-- ============================================================================
SELECT industry, COUNT(*) as total, 
       COUNT(CASE WHEN role_types IS NOT NULL THEN 1 END) as with_roles,
       COUNT(CASE WHEN role_types IS NULL THEN 1 END) as without_roles
FROM job_boards
GROUP BY industry
ORDER BY industry;

SELECT COUNT(*) as boards_with_null_roles FROM job_boards WHERE role_types IS NULL;
