# Setup Guide - Create Database Table

## Critical Step: Create the Database Table

Before testing, you MUST run the SQL migration to create the `app_submissions` table.

### Option 1: Supabase Dashboard (Easiest)

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **"New Query"**
5. Copy and paste the entire contents of `CREATE_APP_SUBMISSIONS_TABLE.sql`
6. Click **"Run"**
7. Wait for success message

### Option 2: Command Line (psql)

1. Get your Supabase connection string from Settings → Database
2. Run:
```bash
psql "postgresql://[user]:[password]@[host]/[database]" < CREATE_APP_SUBMISSIONS_TABLE.sql
```

### Option 3: Verify Manually

After running the migration, verify it worked:

1. Go to Supabase Dashboard
2. Click **"Tables"** in left sidebar
3. Look for `app_submissions` table
4. Should show columns: id, app_name, app_idea, name, location, submission_type, content, created_at, updated_at

---

## Run Tests After Setup

Once the table exists, run:

```bash
node test-build-the-damn-thing-db-search.mjs
```

Expected output:
```
📊 TEST SUMMARY
✅ Passed: 7
❌ Failed: 0
📈 Success Rate: 100%

🎉 ALL TESTS PASSED!
```

---

## Error Messages & Solutions

### "Could not find the table 'public.app_submissions'"
**Problem:** Database table hasn't been created yet  
**Solution:** Run `CREATE_APP_SUBMISSIONS_TABLE.sql` (see options above)

### "HTTP 500" from save endpoint
**Problem:** Supabase credentials missing or table doesn't exist  
**Solution:** Check Netlify environment variables and run migration

### "Supabase project must be accessible"
**Problem:** CORS or connection issue  
**Solution:** Check `NEXT_PUBLIC_SUPABASE_URL` is correct in .env.local

---

## Next Steps

1. ✅ Run the SQL migration (CREATE_APP_SUBMISSIONS_TABLE.sql)
2. ✅ Run the test suite: `node test-build-the-damn-thing-db-search.mjs`
3. ✅ Deploy to Netlify (git push origin main)
4. ✅ Test end-to-end by generating an app with search feature
5. ✅ Save a letter/poem → Search for it → Read it

---

## Quick Copy-Paste for SQL Migration

Go to Supabase Dashboard → SQL Editor → New Query, paste this:

```sql
CREATE TABLE IF NOT EXISTS public.app_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  app_idea TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  submission_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_name TEXT GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
  search_location TEXT GENERATED ALWAYS AS (LOWER(TRIM(COALESCE(location, '')))) STORED
);

CREATE INDEX IF NOT EXISTS idx_app_submissions_app_name ON public.app_submissions(app_name);
CREATE INDEX IF NOT EXISTS idx_app_submissions_search_name ON public.app_submissions(search_name);
CREATE INDEX IF NOT EXISTS idx_app_submissions_search_location ON public.app_submissions(search_location);
CREATE INDEX IF NOT EXISTS idx_app_submissions_type ON public.app_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_app_submissions_created ON public.app_submissions(created_at DESC);

ALTER TABLE public.app_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_read_submissions" ON public.app_submissions
  FOR SELECT USING (true);

CREATE POLICY "allow_public_insert_submissions" ON public.app_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "prevent_delete_submissions" ON public.app_submissions
  FOR DELETE USING (false);

CREATE POLICY "prevent_update_submissions" ON public.app_submissions
  FOR UPDATE USING (false);

GRANT SELECT, INSERT ON public.app_submissions TO anon;
GRANT SELECT, INSERT ON public.app_submissions TO authenticated;
```

Then click **Run** and wait for ✅
