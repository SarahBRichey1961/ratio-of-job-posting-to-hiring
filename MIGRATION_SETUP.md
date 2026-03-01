# MIGRATION SETUP GUIDE

## The Problem
The React errors and 404/400 errors on manifest publishing are caused by the `user_profiles` and `manifestos` tables not being created in your Supabase database yet. The migration files exist locally but haven't been applied to your Supabase instance.

## Solution: Apply Migrations to Supabase

### Step 1: Copy the SQL Migration
The file `APPLY_MIGRATIONS.sql` contains all the necessary SQL to set up the tables.

### Step 2: Apply to Supabase
**Option A: Using Supabase Dashboard (Recommended)**
1. Go to: https://app.supabase.com → Select your project
2. Click "SQL Editor" in the left sidebar
3. Click "+ New Query"
4. Copy the entire contents of `APPLY_MIGRATIONS.sql`
5. Paste into the SQL editor
6. Click "Run"
7. Verify success - should show "CREATE TABLE" messages with no errors

**Option B: Using Supabase CLI**
```bash
supabase db push
```

### Step 3: Verify Tables Were Created
Run these verification queries in Supabase:

```sql
-- Check if user_profiles exists
SELECT tablename FROM pg_tables WHERE tablename = 'user_profiles';

-- Check if manifestos exists
SELECT tablename FROM pg_tables WHERE tablename = 'manifestos';

-- Check RLS is enabled on both
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('user_profiles', 'manifestos');
```

### Step 4: Rebuild and Restart
After migrations are applied:

```bash
npm run build      # Recompile
npm run dev        # Start dev server
```

### Step 5: Test Again
1. Open http://localhost:3000/auth/signup
2. Sign up with a new email
3. Should auto-login and redirect to /hub/members/new
4. You should see "Account Connected" badge
5. Create and publish a manifesto
6. Should get a shareable URL

## What Each Migration Does

### user_profiles Table
- Stores user profile data
- Links to Supabase auth.users
- RLS policies allow users to read/write their own profile only
- Automatically created when user first logs in (via AuthContext listener)

### manifestos Table  
- Stores user manifestos content
- Links to user via user_id
- RLS policies allow users to read/write their own manifestos
- Public read access for published=true manifestos
- Slug field is UNIQUE for URL generation

## If You Still Get Errors

### Error: "Could not find the table 'public.user_profiles'"
- **Cause**: Migrations not applied yet
- **Solution**: Follow steps above to apply APPLY_MIGRATIONS.sql

### Error: "permission denied" or status 403
- **Cause**: RLS policy issue
- **Solution**: Verify RLS is enabled (see Verify step above)

### Error: "Request failed with status code 400"
- **Cause**: Table not found OR RLS blocking access
- **Solution**: Check both tables exist and RLS is set up correctly

## What's Fixed

The code has been updated to:
1. ✅ Better handle missing tables (gives helpful error message)
2. ✅ Prevent React state update errors (better async handling)
3. ✅ Create default profile if table is missing (allows user to continue)
4. ✅ Better error logging to help debug issues

## Still Need Help?

Check server logs in terminal running `npm run dev`:
- Look for "Profile not found, creating default profile" messages
- Look for any "Error" log messages
- These will tell you exactly what's happening

Copy any errors you see and review the Supabase logs:
https://app.supabase.com → Select your project → Logs
