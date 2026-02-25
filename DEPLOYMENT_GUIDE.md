# PM Daily Board Activity Feed - Quick Deployment Guide

## Prerequisites
- Access to Supabase dashboard
- Access to Netlify dashboard
- Supabase project URL and API keys

---

## Step 1: Deploy Database Migrations

### Option A: Using Supabase CLI (Fastest)
```bash
supabase db push
```
This automatically applies all migration files in `supabase/migrations/` to your database.

### Option B: Manual - Supabase Dashboard SQL Editor

1. **Open SQL Editor**
   - Go to: https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new
   - Or: Dashboard → SQL Editor → New Query

2. **Run Migration 025 (Create Tables)**
   - Copy entire content of: `supabase/migrations/025_create_daily_board_activity.sql`
   - Paste into SQL editor
   - Click **Run**
   - Expected output: "Query successful" (no rows returned)

3. **Run Migration 026 (Seed Sample Data)**
   - Copy entire content of: `supabase/migrations/026_seed_daily_board_activity.sql`
   - Paste into SQL editor
   - Click **Run**
   - Expected output: "71 rows inserted" (for 71 job boards)

### Option C: Manual - Using psql

```bash
# You need Supabase credentials first
# Get from: https://app.supabase.com/project/[ID]/settings/database

psql -h db.XXXXXXXXXX.supabase.co \
     -U postgres \
     -d postgres \
     -c "$(cat supabase/migrations/025_create_daily_board_activity.sql)"

psql -h db.XXXXXXXXXX.supabase.co \
     -U postgres \
     -d postgres \
     -c "$(cat supabase/migrations/026_seed_daily_board_activity.sql)"
```

### Verify Migrations Succeeded

Run this query in Supabase SQL Editor:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname='public' 
AND tablename LIKE 'daily_%' 
ORDER BY tablename;
```

**Expected result:**
```
         tablename
─────────────────────────────
 daily_board_activity
 daily_board_company_mix
 daily_role_seniority
(3 rows)
```

Also verify seed data:
```sql
SELECT COUNT(*) as total_records FROM daily_board_activity;
```

**Expected result:** `71` (71 job boards with sample data for 2026-02-24)

---

## Step 2: Configure Netlify Environment Variables

You need to set 2 variables. Get the values from:
- **URL**: https://app.supabase.com/project/[ID]/settings/api (Copy "URL")
- **Key**: https://app.supabase.com/project/[ID]/settings/api (Copy "anon public" key)

### Option A: Netlify Dashboard

1. Go to: https://app.netlify.com/sites/[YOUR_SITE_NAME]/settings/env
2. Click **Add a variable**
3. Enter first variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://XXXXXXXX.supabase.co`
   - Click **Save**
4. Click **Add a variable** again
5. Enter second variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbG... (long string from Supabase)`
   - Click **Save**

6. **Trigger new deploy** to load the variables
   - Go to: https://app.netlify.com/sites/[YOUR_SITE_NAME]/deploys
   - Click **Trigger deploy** → **Deploy site**

### Option B: Netlify CLI

```bash
# Set first variable
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://XXXXXXXX.supabase.co"

# Set second variable
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbG..."

# Trigger rebuild
netlify deploy --trigger
```

### Option C: PowerShell Interactive

```powershell
# Get values from user
$supabaseUrl = Read-Host "Enter Supabase URL"
$anonKey = Read-Host "Enter Supabase Anon Key"

# Set on Netlify
netlify env:set NEXT_PUBLIC_SUPABASE_URL $supabaseUrl
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY $anonKey

# Rebuild
netlify deploy --trigger
```

---

## Step 3: Verify Deployment

### Test API Endpoint

```bash
# Using curl
curl "https://your-site.netlify.app/api/pm/daily-feed?date=2026-02-24"

# Should return JSON like:
# {
#   "date": "2026-02-24",
#   "summary": { ... },
#   "boards": [ ... ],
#   "timestamp": "2026-02-24T..."
# }
```

### Test Dashboard Page

Visit: `https://your-site.netlify.app/dashboard/pm-analytics`

Should see:
- ✓ Date picker for selecting dates
- ✓ Summary metric cards (Total Postings, Avg Velocity, etc.)
- ✓ Table with all 71 job boards
- ✓ Filter and sort controls

---

## Step 4: (Optional) Run Ingestion Script

To populate today's data with real postings (requires data in `job_postings` table):

```bash
# Compute metrics for a specific date
npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24

# Or for today
npx tsx scripts/computeDailyBoardActivity.ts
```

---

## Troubleshooting

### API returns "No data available for date 2026-02-24"
**Cause**: Migrations not applied or seed data not inserted
**Fix**: Run migrations 025 and 026 as described in Step 1

### API returns 502 Bad Gateway
**Cause**: Environment variables not set on Netlify
**Fix**: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as described in Step 2

### Dashboard page shows "Error Loading Feed"
**Cause**: Supabase credentials invalid or API endpoint fails
**Fix**: Check browser console for error, verify API endpoint works with curl

### Migration fails with "Table already exists"
**Cause**: Tables already exist from previous run
**Fix**: Use `CREATE TABLE IF NOT EXISTS` (already in migrations - safe to rerun)

---

## Next Steps

1. **Add Navigation Link**: Update `/src/pages/dashboard/index.tsx` to include link to PM Analytics
2. **Schedule Ingestion**: Set up daily cron job (see PM_DAILY_FEED_SETUP.md)
3. **Monitor Usage**: Check Supabase logs for query performance

---

## Quick Command Reference

```bash
# Deploy script (automates steps 1-3)
./scripts/deploy-pm-feed.sh          # Linux/Mac
powershell scripts/deploy-pm-feed.ps1 # Windows

# Manual deployment
supabase db push                      # Apply migrations

# Test API
curl https://your-site.netlify.app/api/pm/daily-feed

# Run ingestion
npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24

# Netlify env vars
netlify env:set NEXT_PUBLIC_SUPABASE_URL "..."
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "..."

# Rebuild
netlify deploy --trigger
```

---

For more details, see: `PM_DAILY_FEED_SETUP.md`
