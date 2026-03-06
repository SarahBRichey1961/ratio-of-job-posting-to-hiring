-- FIX PERMISSIONS: Grant proper access to the API roles
-- Supabase needs these grants for PostgREST to see the tables

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on tables to all roles
GRANT ALL PRIVILEGES ON advertiser_accounts TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON advertisements TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ad_impressions TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ad_clicks TO postgres, anon, authenticated, service_role;

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Allow RLS to work properly - anon can't see anything by default with RLS
-- authenticated users see only their own data via the RLS policies
-- This is handled by the RLS policies already set up

-- Verify permissions
SELECT 
  tablename,
  array_agg(DISTINCT privilege)::text[] as privileges
FROM (
  SELECT 
    t.tablename,
    (aclexplode(t.relacl)).privilege
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' 
  AND t.tablename IN ('advertiser_accounts', 'advertisements', 'ad_impressions', 'ad_clicks')
) subq
GROUP BY tablename
ORDER BY tablename;
