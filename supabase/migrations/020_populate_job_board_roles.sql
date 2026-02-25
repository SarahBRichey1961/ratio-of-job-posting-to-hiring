-- Migration: Populate job_board_roles junction table
-- Purpose: Define which roles are available on each job board

-- Technology boards - all tech roles
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('Dice', 'Stack Overflow Jobs', 'Built In', 'AngelList Talent', 'Hired')
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Construction boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('ConstructionJobs.com', 'iHireConstruction', 'Roadtechs', 'Tradesmen International')
AND jr.name IN ('Construction Worker', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Transportation & Logistics boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('TruckersReport Jobs', 'CDL Job Now', 'JobsInLogistics', 'FleetJobs')
AND jr.name IN ('Truck Driver', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Retail & Hospitality boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('HCareers', 'Poached Jobs', 'Culinary Agents', 'AllRetailJobs')
AND jr.name IN ('Retail', 'Sales')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Creative & Media boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('Behance Job Board', 'Dribbble Jobs', 'We Work Remotely', 'The Muse')
AND jr.name IN ('Designer', 'Product Manager', 'Marketing')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Science, Research & Biotech boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('BioSpace', 'Science Careers', 'Nature Careers', 'PharmiWeb')
AND jr.name IN ('Scientist', 'Data Scientist')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Education boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('HigherEdJobs', 'Chronicle Jobs', 'K12JobSpot', 'TeachAway')
AND jr.name IN ('Teacher', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Government boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('USAJobs', 'GovernmentJobs.com', 'Careers in Government')
AND jr.name IN ('Operations', 'Executive')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Finance & Accounting boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('eFinancialCareers', 'AccountingJobsToday', 'FinancialJobBank')
AND jr.name IN ('Accountant', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Legal boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('LawCrossing', 'NALP Jobs', 'LawJobs.com')
AND jr.name IN ('Lawyer', 'Sales')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Manufacturing boards
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('ManufacturingJobs.com', 'iHireManufacturing', 'Engineering.com')
AND jr.name IN ('Manufacturer', 'Operations', 'DevOps Engineer')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- Remote boards - all roles (they're remote-friendly)
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('RemoteOK', 'FlexJobs', 'Working Nomads')
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Designer', 'Sales', 'Marketing', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;

-- General/Mainstream boards - broad role coverage
INSERT INTO job_board_roles (job_board_id, job_role_id)
SELECT jb.id, jr.id FROM job_boards jb, job_roles jr
WHERE jb.name IN ('LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster', 'CareerBuilder', 'Snagajob', 'Craigslist', 'GitHub Jobs', 'Sentry Jobs')
AND jr.name IN ('Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'Designer', 'Sales', 'Marketing', 'Operations')
ON CONFLICT (job_board_id, job_role_id) DO NOTHING;
