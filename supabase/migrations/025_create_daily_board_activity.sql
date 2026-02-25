-- Daily job board activity metrics table
-- Captures daily snapshots of board activity for PM reporting

CREATE TABLE IF NOT EXISTS public.daily_board_activity (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    board_id INTEGER NOT NULL,
    board_name VARCHAR(255) NOT NULL,
    
    -- Volume metrics
    new_postings INTEGER DEFAULT 0,
    posting_velocity DECIMAL(10,2), -- postings per hour
    total_active_postings INTEGER DEFAULT 0,
    
    -- Seniority breakdown (percentages)
    entry_level_pct DECIMAL(5,2),      -- 0-2 years
    mid_level_pct DECIMAL(5,2),         -- 2-5 years
    senior_level_pct DECIMAL(5,2),      -- 5+ years
    
    -- Geography breakdown (percentages)
    remote_pct DECIMAL(5,2),
    onsite_pct DECIMAL(5,2),
    hybrid_pct DECIMAL(5,2),
    
    -- Company metrics
    unique_companies INTEGER DEFAULT 0,
    top_company_concentration DECIMAL(5,2), -- % from top 10
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_daily_activity UNIQUE(date, board_id)
);

-- Company concentration detail (top 10 companies per board/day)
CREATE TABLE IF NOT EXISTS public.daily_board_company_mix (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    board_id INTEGER NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    postings_count INTEGER DEFAULT 0,
    pct_of_board DECIMAL(5,2),
    rank_position SMALLINT, -- 1-10
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_company_daily UNIQUE(date, board_id, company_name)
);

-- Role seniority breakdown detail
CREATE TABLE IF NOT EXISTS public.daily_role_seniority (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    board_id INTEGER NOT NULL,
    role_type VARCHAR(100),        -- "Developer", "PM", "Designer", etc.
    seniority_level VARCHAR(50),   -- "Entry", "Mid", "Senior"
    postings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_role_seniority UNIQUE(date, board_id, role_type, seniority_level)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_board_activity(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activity_board ON public.daily_board_activity(board_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_company_date ON public.daily_board_company_mix(date DESC, rank_position);
CREATE INDEX IF NOT EXISTS idx_daily_role_date ON public.daily_role_seniority(date DESC, board_id);

-- Enable RLS
ALTER TABLE public.daily_board_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_board_company_mix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_role_seniority ENABLE ROW LEVEL SECURITY;

-- Public read access for all authenticated users
CREATE POLICY "public_read_daily_activity" ON public.daily_board_activity
    FOR SELECT USING (true);

CREATE POLICY "public_read_company_mix" ON public.daily_board_company_mix
    FOR SELECT USING (true);

CREATE POLICY "public_read_role_seniority" ON public.daily_role_seniority
    FOR SELECT USING (true);

-- Admin insert/update access
CREATE POLICY "admin_manage_daily_activity" ON public.daily_board_activity
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_company_mix" ON public.daily_board_company_mix
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_role_seniority" ON public.daily_role_seniority
    FOR ALL USING (auth.role() = 'authenticated');
