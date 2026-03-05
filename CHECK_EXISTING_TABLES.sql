-- SIMPLE TEST: Check what tables exist
-- Run this to see the current state

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
