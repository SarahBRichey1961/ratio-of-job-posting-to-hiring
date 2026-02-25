-- Seed data for daily_board_activity with realistic PM-friendly metrics
-- Generated for 2026-02-24

INSERT INTO public.daily_board_activity (
    date, board_id, board_name, new_postings, posting_velocity, total_active_postings,
    entry_level_pct, mid_level_pct, senior_level_pct,
    remote_pct, onsite_pct, hybrid_pct,
    unique_companies, top_company_concentration
) VALUES
-- Top volume boards (LinkedIn, Indeed, Monster are highest)
('2026-02-24', 1, 'LinkedIn', 2847, 118.6, 15243, 22, 48, 30, 35, 45, 20, 1240, 12.3),
('2026-02-24', 2, 'Indeed', 3156, 131.5, 18920, 24, 46, 30, 32, 52, 16, 2105, 8.7),
('2026-02-24', 3, 'Monster', 2340, 97.5, 14560, 26, 44, 30, 28, 58, 14, 1890, 9.8),

-- Mid-high volume tech-focused
('2026-02-24', 4, 'Stack Overflow Jobs', 1205, 50.2, 6845, 18, 42, 40, 68, 20, 12, 892, 15.2),
('2026-02-24', 5, 'GitHub Jobs', 456, 19.0, 2340, 20, 50, 30, 75, 15, 10, 345, 18.5),
('2026-02-24', 6, 'Built In', 867, 36.1, 4230, 25, 48, 27, 45, 35, 20, 645, 11.2),
('2026-02-24', 7, 'Dice', 654, 27.3, 3420, 16, 45, 39, 52, 32, 16, 523, 14.1),

-- Remote-focused boards (high remote %)
('2026-02-24', 8, 'We Work Remotely', 892, 37.2, 4156, 28, 46, 26, 92, 3, 5, 456, 19.8),
('2026-02-24', 9, 'FlexJobs', 523, 21.8, 2567, 32, 44, 24, 88, 5, 7, 312, 22.1),
('2026-02-24', 10, 'RemoteOK', 645, 26.9, 3123, 30, 45, 25, 95, 2, 3, 389, 21.3),

-- Specialized boards (lower volume, high senior %)
('2026-02-24', 11, 'AngelList Talent', 234, 9.8, 1120, 12, 35, 53, 48, 32, 20, 234, 28.3),
('2026-02-24', 12, 'Y Combinator', 89, 3.7, 420, 8, 28, 64, 62, 25, 13, 145, 35.7),
('2026-02-24', 13, 'CrunchBoard', 156, 6.5, 756, 10, 32, 58, 58, 28, 14, 178, 31.2),

-- Niche/Industry boards
('2026-02-24', 14, 'Healthcare Jobs', 234, 9.8, 1234, 28, 42, 30, 15, 72, 13, 189, 26.4),
('2026-02-24', 15, 'LawCrossing', 145, 6.0, 678, 22, 38, 40, 12, 78, 10, 134, 29.6),
('2026-02-24', 16, 'ProFinder', 89, 3.7, 423, 26, 44, 30, 35, 55, 10, 98, 32.1),
('2026-02-24', 17, 'Dribbble', 234, 9.8, 1156, 35, 42, 23, 72, 18, 10, 312, 24.2),
('2026-02-24', 18, 'Behance', 178, 7.4, 834, 38, 40, 22, 68, 20, 12, 267, 25.8),
('2026-02-24', 19, 'Coroflot', 95, 4.0, 445, 40, 38, 22, 65, 22, 13, 156, 28.4),

-- Sales & Business
('2026-02-24', 20, 'SalesHacker', 123, 5.1, 567, 24, 48, 28, 42, 48, 10, 145, 27.3),
('2026-02-24', 21, 'ZoomInfo', 98, 4.1, 456, 22, 46, 32, 38, 52, 10, 123, 29.1),
('2026-02-24', 22, 'Apollo.io', 112, 4.7, 523, 26, 44, 30, 40, 50, 10, 134, 28.5),

-- Government & Non-Profit
('2026-02-24', 23, 'USAJOBS', 456, 19.0, 2234, 20, 40, 40, 8, 90, 2, 289, 18.5),
('2026-02-24', 24, 'VolunteerHub', 78, 3.3, 345, 35, 42, 23, 75, 15, 10, 89, 33.7),
('2026-02-24', 25, 'Idealist.org', 145, 6.0, 678, 32, 40, 28, 70, 20, 10, 156, 31.2),

-- Additional volume boards (generic names for other slots)
('2026-02-24', 26, 'CareerBuilder', 1845, 76.9, 9234, 24, 48, 28, 30, 54, 16, 1567, 9.2),
('2026-02-24', 27, 'ZipRecruiter', 2134, 89.0, 11245, 26, 46, 28, 34, 50, 16, 1834, 8.9),
('2026-02-24', 28, 'Glassdoor', 1956, 81.5, 10234, 25, 47, 28, 32, 52, 16, 1723, 9.1),
('2026-02-24', 29, 'LinkedIn Recruiter', 1234, 51.4, 6789, 18, 50, 32, 40, 42, 18, 1023, 11.4),
('2026-02-24', 30, 'Hired', 345, 14.4, 1834, 22, 52, 26, 58, 28, 14, 289, 19.7),

-- More specialized boards
('2026-02-24', 31, 'Upwork', 2456, 102.3, 12340, 32, 44, 24, 85, 10, 5, 2134, 7.8),
('2026-02-24', 32, 'Fiverr', 1834, 76.4, 9456, 35, 42, 23, 82, 12, 6, 1834, 8.2),
('2026-02-24', 33, 'Toptal', 234, 9.8, 1123, 12, 45, 43, 88, 8, 4, 267, 24.3),
('2026-02-24', 34, 'Gun.io', 89, 3.7, 423, 8, 40, 52, 92, 5, 3, 134, 32.8),
('2026-02-24', 35, 'Authentic Jobs', 178, 7.4, 834, 28, 48, 24, 70, 20, 10, 201, 26.4),
('2026-02-24', 36, 'The Dots', 145, 6.0, 678, 32, 46, 22, 65, 25, 10, 178, 28.1),
('2026-02-24', 37, 'Dribbble Teams', 112, 4.7, 534, 36, 44, 20, 68, 18, 14, 145, 29.7),
('2026-02-24', 38, 'Cargo', 95, 4.0, 445, 38, 42, 20, 72, 16, 12, 123, 30.2),
('2026-02-24', 39, 'ADPList', 67, 2.8, 312, 45, 38, 17, 75, 15, 10, 98, 31.4),
('2026-02-24', 40, 'Krop', 123, 5.1, 567, 40, 40, 20, 70, 20, 10, 156, 27.8),

-- Tech & Developer focused
('2026-02-24', 41, 'Dev.org', 234, 9.8, 1123, 20, 48, 32, 75, 15, 10, 267, 21.3),
('2026-02-24', 42, 'We Hire Dev', 189, 7.9, 890, 22, 50, 28, 78, 12, 10, 234, 23.1),
('2026-02-24', 43, 'RemoteDev', 156, 6.5, 734, 24, 48, 28, 90, 5, 5, 201, 24.8),
('2026-02-24', 44, 'Hacker News Jobs', 234, 9.8, 1124, 16, 44, 40, 72, 18, 10, 289, 22.4),
('2026-02-24', 45, 'dev.to Jobs', 145, 6.0, 678, 24, 50, 26, 75, 15, 10, 178, 25.2),
('2026-02-24', 46, 'Indie Hackers', 95, 4.0, 445, 28, 46, 26, 82, 12, 6, 145, 28.5),

-- Industry-specific continued
('2026-02-24', 47, 'Startup Jobs', 234, 9.8, 1145, 26, 48, 26, 52, 32, 16, 278, 23.6),
('2026-02-24', 48, 'We Work', 189, 7.9, 890, 30, 46, 24, 88, 8, 4, 234, 25.1),
('2026-02-24', 49, 'Distributed', 156, 6.5, 734, 28, 48, 24, 86, 8, 6, 201, 26.3),
('2026-02-24', 50, 'Nomad List Jobs', 123, 5.1, 567, 32, 44, 24, 89, 6, 5, 156, 28.7),

-- Additional slots for 71 boards
('2026-02-24', 51, 'Skip The Line', 145, 6.0, 678, 24, 50, 26, 70, 20, 10, 189, 24.5),
('2026-02-24', 52, 'Our Team', 98, 4.1, 456, 22, 48, 30, 75, 15, 10, 134, 27.2),
('2026-02-24', 53, 'Connectedly', 112, 4.7, 523, 26, 46, 28, 72, 18, 10, 145, 26.8),
('2026-02-24', 54, 'Unicorn Hunt', 89, 3.7, 423, 20, 44, 36, 65, 25, 10, 123, 29.4),
('2026-02-24', 55, 'Angel List', 234, 9.8, 1124, 18, 40, 42, 58, 28, 14, 289, 21.7),
('2026-02-24', 56, 'Crunchboard', 167, 7.0, 789, 22, 46, 32, 62, 28, 10, 201, 25.3),
('2026-02-24', 57, 'Builtin HQ', 145, 6.0, 678, 24, 48, 28, 48, 38, 14, 178, 24.1),
('2026-02-24', 58, 'Bluesteps', 112, 4.7, 534, 12, 42, 46, 42, 48, 10, 156, 30.2),
('2026-02-24', 59, 'Executive Registry', 95, 4.0, 445, 8, 32, 60, 38, 50, 12, 134, 32.8),
('2026-02-24', 60, 'Linkedin Executive', 178, 7.4, 834, 10, 35, 55, 40, 48, 12, 189, 31.5),
('2026-02-24', 61, 'Kforce', 134, 5.6, 623, 16, 48, 36, 45, 45, 10, 167, 28.3),
('2026-02-24', 62, 'Robert Half', 167, 7.0, 789, 18, 50, 32, 40, 50, 10, 201, 26.9),
('2026-02-24', 63, 'Manpower', 145, 6.0, 678, 22, 48, 30, 35, 55, 10, 189, 27.6),
('2026-02-24', 64, 'Kelly Services', 128, 5.3, 601, 20, 46, 34, 36, 54, 10, 178, 28.4),
('2026-02-24', 65, 'Heidrick & Struggles', 89, 3.7, 423, 8, 30, 62, 35, 52, 13, 123, 34.2),
('2026-02-24', 66, 'Korn Ferry', 112, 4.7, 534, 10, 32, 58, 38, 50, 12, 156, 33.8),
('2026-02-24', 67, 'Russell Tobin', 98, 4.1, 456, 15, 45, 40, 40, 48, 12, 145, 29.7),
('2026-02-24', 68, 'Volt', 145, 6.0, 678, 20, 48, 32, 42, 48, 10, 189, 26.3),
('2026-02-24', 69, 'Heidrick', 78, 3.3, 367, 12, 36, 52, 36, 52, 12, 112, 31.9),
('2026-02-24', 70, 'Spencer Stuart', 67, 2.8, 312, 10, 28, 62, 34, 54, 12, 98, 35.6),
('2026-02-24', 71, 'Egon Zehnder', 56, 2.3, 261, 8, 26, 66, 32, 56, 12, 87, 36.8)
ON CONFLICT (date, board_id) DO UPDATE SET
    new_postings = EXCLUDED.new_postings,
    posting_velocity = EXCLUDED.posting_velocity,
    total_active_postings = EXCLUDED.total_active_postings,
    entry_level_pct = EXCLUDED.entry_level_pct,
    mid_level_pct = EXCLUDED.mid_level_pct,
    senior_level_pct = EXCLUDED.senior_level_pct,
    remote_pct = EXCLUDED.remote_pct,
    onsite_pct = EXCLUDED.onsite_pct,
    hybrid_pct = EXCLUDED.hybrid_pct,
    unique_companies = EXCLUDED.unique_companies,
    top_company_concentration = EXCLUDED.top_company_concentration,
    updated_at = NOW();

-- Seed top companies for high-volume boards
INSERT INTO public.daily_board_company_mix (date, board_id, company_name, postings_count, pct_of_board, rank_position) VALUES
-- LinkedIn top companies
('2026-02-24', 1, 'Microsoft', 89, 3.1, 1),
('2026-02-24', 1, 'Google', 76, 2.7, 2),
('2026-02-24', 1, 'Amazon', 72, 2.5, 3),
('2026-02-24', 1, 'Apple', 68, 2.4, 4),
('2026-02-24', 1, 'Meta', 65, 2.3, 5),
('2026-02-24', 1, 'Goldman Sachs', 58, 2.0, 6),
('2026-02-24', 1, 'Morgan Stanley', 54, 1.9, 7),
('2026-02-24', 1, 'JP Morgan', 51, 1.8, 8),
('2026-02-24', 1, 'McKinsey', 48, 1.7, 9),
('2026-02-24', 1, 'BCG', 45, 1.6, 10),

-- Indeed top companies  
('2026-02-24', 2, 'Amazon', 127, 4.0, 1),
('2026-02-24', 2, 'Walmart', 118, 3.7, 2),
('2026-02-24', 2, 'Target', 105, 3.3, 3),
('2026-02-24', 2, 'CVS Health', 98, 3.1, 4),
('2026-02-24', 2, 'Starbucks', 92, 2.9, 5),
('2026-02-24', 2, 'McDonald''s', 87, 2.8, 6),
('2026-02-24', 2, 'Home Depot', 82, 2.6, 7),
('2026-02-24', 2, 'Lowes', 78, 2.5, 8),
('2026-02-24', 2, 'Best Buy', 71, 2.3, 9),
('2026-02-24', 2, 'Dollar General', 68, 2.2, 10),

-- Stack Overflow top companies
('2026-02-24', 4, 'Google', 45, 3.7, 1),
('2026-02-24', 4, 'Microsoft', 42, 3.5, 2),
('2026-02-24', 4, 'Amazon', 38, 3.2, 3),
('2026-02-24', 4, 'Meta', 34, 2.8, 4),
('2026-02-24', 4, 'Apple', 31, 2.6, 5),
('2026-02-24', 4, 'Netflix', 28, 2.3, 6),
('2026-02-24', 4, 'Stripe', 25, 2.1, 7),
('2026-02-24', 4, 'Airbnb', 22, 1.8, 8),
('2026-02-24', 4, 'Uber', 19, 1.6, 9),
('2026-02-24', 4, 'Pinterest', 17, 1.4, 10);

-- Seed role/seniority breakdown for top boards
INSERT INTO public.daily_role_seniority (date, board_id, role_type, seniority_level, postings_count) VALUES
-- LinkedIn roles/seniority
('2026-02-24', 1, 'Software Engineer', 'Entry', 312),
('2026-02-24', 1, 'Software Engineer', 'Mid', 678),
('2026-02-24', 1, 'Software Engineer', 'Senior', 456),
('2026-02-24', 1, 'Product Manager', 'Entry', 89),
('2026-02-24', 1, 'Product Manager', 'Mid', 234),
('2026-02-24', 1, 'Product Manager', 'Senior', 167),
('2026-02-24', 1, 'Data Scientist', 'Entry', 145),
('2026-02-24', 1, 'Data Scientist', 'Mid', 289),
('2026-02-24', 1, 'Data Scientist', 'Senior', 178),
('2026-02-24', 1, 'Designer', 'Entry', 167),
('2026-02-24', 1, 'Designer', 'Mid', 245),
('2026-02-24', 1, 'Designer', 'Senior', 112),

-- Indeed roles/seniority
('2026-02-24', 2, 'Software Engineer', 'Entry', 378),
('2026-02-24', 2, 'Software Engineer', 'Mid', 756),
('2026-02-24', 2, 'Software Engineer', 'Senior', 567),
('2026-02-24', 2, 'Sales Representative', 'Entry', 267),
('2026-02-24', 2, 'Sales Representative', 'Mid', 478),
('2026-02-24', 2, 'Sales Representative', 'Senior', 245),
('2026-02-24', 2, 'Customer Support', 'Entry', 456),
('2026-02-24', 2, 'Customer Support', 'Mid', 289),
('2026-02-24', 2, 'Customer Support', 'Senior', 123),
('2026-02-24', 2, 'Accountant', 'Entry', 178),
('2026-02-24', 2, 'Accountant', 'Mid', 234),
('2026-02-24', 2, 'Accountant', 'Senior', 189),

-- Stack Overflow roles/seniority (heavily senior-weighted)
('2026-02-24', 4, 'Software Engineer', 'Entry', 162),
('2026-02-24', 4, 'Software Engineer', 'Mid', 342),
('2026-02-24', 4, 'Software Engineer', 'Senior', 456),
('2026-02-24', 4, 'DevOps Engineer', 'Entry', 54),
('2026-02-24', 4, 'DevOps Engineer', 'Mid', 145),
('2026-02-24', 4, 'DevOps Engineer', 'Senior', 234),
('2026-02-24', 4, 'Data Engineer', 'Entry', 78),
('2026-02-24', 4, 'Data Engineer', 'Mid', 156),
('2026-02-24', 4, 'Data Engineer', 'Senior', 189)
ON CONFLICT (date, board_id, role_type, seniority_level) DO UPDATE SET
    postings_count = EXCLUDED.postings_count;
