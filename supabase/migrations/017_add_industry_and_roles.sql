-- Migration: Add industry support and roles table
-- Purpose: Enable multi-industry support and role-based filtering

-- 1. Add industry column to job_boards
ALTER TABLE job_boards 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100) DEFAULT 'General';

-- Create index on industry for fast filtering
CREATE INDEX IF NOT EXISTS idx_job_boards_industry ON job_boards(industry);

-- 2. Create roles enumeration table
CREATE TABLE IF NOT EXISTS job_roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_job_roles_name ON job_roles(name);

-- 3. Insert standard job roles
INSERT INTO job_roles (name, description) VALUES
('Frontend Developer', 'Frontend/UI developer positions'),
('Backend Developer', 'Server-side and backend development'),
('Full Stack Developer', 'Full stack development roles'),
('Data Scientist', 'Data science and analytics roles'),
('DevOps Engineer', 'DevOps, infrastructure, cloud engineering'),
('Product Manager', 'Product management positions'),
('Designer', 'UX/UI and design roles'),
('Sales', 'Sales and account management'),
('Marketing', 'Marketing and growth roles'),
('Operations', 'Operations and business roles'),
('Executive', 'C-level and executive positions'),
('Construction Worker', 'Construction and skilled trades'),
('Truck Driver', 'Transportation and logistics'),
('Retail', 'Retail and hospitality roles'),
('Accountant', 'Accounting and finance'),
('Lawyer', 'Legal positions'),
('Healthcare', 'Healthcare and medical roles'),
('Teacher', 'Education and teaching positions'),
('Scientist', 'Research and scientific positions'),
('Manufacturer', 'Manufacturing and production')
ON CONFLICT (name) DO NOTHING;

-- 4. Add industry column to efficiency_scores if not exists
ALTER TABLE efficiency_scores
ADD COLUMN IF NOT EXISTS industry_filter VARCHAR(100);

-- Create index
CREATE INDEX IF NOT EXISTS idx_efficiency_scores_industry_filter ON efficiency_scores(industry_filter);

-- 5. Add a job_board_roles junction table for many-to-many
CREATE TABLE IF NOT EXISTS job_board_roles (
  id BIGSERIAL PRIMARY KEY,
  job_board_id BIGINT NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  job_role_id BIGINT NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_board_id, job_role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_board_roles_board_id ON job_board_roles(job_board_id);
CREATE INDEX IF NOT EXISTS idx_job_board_roles_role_id ON job_board_roles(job_role_id);
