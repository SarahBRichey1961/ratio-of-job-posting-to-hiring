# PM Daily Board Activity Feed - Setup Guide

## Overview
This feature provides comprehensive daily job board activity metrics including:
- **Volume metrics**: New postings, posting velocity (postings/hour), total active postings
- **Seniority mix**: Entry%, Mid%, Senior% breakdown for each board
- **Geography**: Remote%, Onsite%, Hybrid% distribution
- **Company concentration**: Unique companies, top 10 companies by volume
- **Role breakdown**: Postings by role type and seniority level

## Architecture

### Components

1. **Data Layer** (`supabase/migrations/025_create_daily_board_activity.sql`)
   - `daily_board_activity` - Main metrics table (71 rows/day)
   - `daily_board_company_mix` - Top 10 companies per board/day
   - `daily_role_seniority` - Role/seniority breakdown per board/day
   - RLS enabled with public read, authenticated write

2. **Ingestion Script** (`scripts/computeDailyBoardActivity.ts`)
   - Reads raw job postings from database
   - Computes aggregated metrics for each board
   - Infers seniority level from job title
   - Infers location type (remote/onsite/hybrid) from job description
   - Saves to normalized tables
   - Can be scheduled weekly with a cron job

3. **API Endpoint** (`src/pages/api/pm/daily-feed.ts`)
   - `GET /api/pm/daily-feed?date=YYYY-MM-DD`
   - Returns comprehensive JSON feed with all metrics
   - Defaults to yesterday if no date specified
   - Cache-friendly (1 hour client cache, 1 day server cache)

4. **React Component** (`src/components/PMDailyFeed.tsx`)
   - Full dashboard with date picker
   - Sortable by postings, velocity, or total active
   - Filters for remote-focused vs traditional boards
   - Filters for seniority level breakdown
   - Summary metrics cards
   - Comprehensive board metrics table
   - Top companies section

5. **Dashboard Page** (`src/pages/dashboard/pm-analytics.tsx`)
   - Protected route (authentication required)
   - Integrated into existing DashboardLayout
   - Links from main dashboard

## Setup Steps

### Step 1: Deploy Database Migrations
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Manual - Copy and paste migration SQL to Supabase dashboard
# 1. Go to Supabase dashboard → SQL Editor
# 2. Run: supabase/migrations/025_create_daily_board_activity.sql
# 3. Run: supabase/migrations/026_seed_daily_board_activity.sql
```

### Step 2: Install Date Utilities (if needed)
```bash
npm install date-fns
# Already likely installed, but verify in package.json
```

### Step 3: Test the API Endpoint Locally
```bash
# Start dev server
npm run dev

# Test endpoint in browser or curl
curl http://localhost:3000/api/pm/daily-feed?date=2026-02-24
```

### Step 4: Run Ingestion Script Once (Manual Test)
```bash
# Compute metrics for a specific date
npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24

# Or for today
npx tsx scripts/computeDailyBoardActivity.ts
```

### Step 5: Schedule Ingestion Script for Daily Execution

#### Option A: Node Cron Job (Recommended)
Create `scripts/daily-scheduler.ts`:
```typescript
import cron from 'node-cron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Run every day at 08:00 UTC
cron.schedule('0 8 * * *', async () => {
  console.log('[%s] Starting daily board metrics computation...', new Date().toISOString())
  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/computeDailyBoardActivity.ts')
    console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error) {
    console.error('Error running daily ingestion:', error)
  }
})

console.log('Scheduler started. Waiting for cron jobs...')
```

#### Option B: GitHub Actions (Production-Recommended)
Create `.github/workflows/daily-board-metrics.yml`:
```yaml
name: Daily Board Metrics

on:
  schedule:
    # Run at 08:00 UTC daily
    - cron: '0 8 * * *'

jobs:
  compute-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npx tsx scripts/computeDailyBoardActivity.ts
```

#### Option C: Railway/Netlify Scheduled Functions
Use their native scheduling features to call `/api/pm/daily-feed` endpoint.

#### Option D: Cloud Scheduler (GCP)
Set up Cloud Scheduler to trigger your deployed endpoint daily.

### Step 6: Update Dashboard Navigation
Edit `src/pages/dashboard/index.tsx` to add link to PM Analytics:
```tsx
<Link href="/dashboard/pm-analytics">
  <a className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400">
    <div className="font-semibold text-blue-900">📊 PM Daily Analytics</div>
    <div className="text-sm text-blue-700">Job board activity metrics</div>
  </a>
</Link>
```

### Step 7: Verify Deployment
1. Navigate to `/dashboard/pm-analytics` in your app
2. Check that data loads from the seeded test data (2026-02-24)
3. Try different dates, filters, and sorts
4. Verify API endpoint returns valid JSON

## Usage

### For Development
```bash
# Run metrics for a test date
npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24

# View API response
curl http://localhost:3000/api/pm/daily-feed?date=2026-02-24
```

### In Production
- Visit `/dashboard/pm-analytics` in the app
- Select any date to view metrics
- Use filters to find specific board types:
  - Remote-heavy (50%+ remote)
  - Traditional boards (<50% remote)
  - Entry-level focused
  - Mid-level focused
  - Senior-level focused
- Sort by volume, velocity, or total active
- Review top companies section

## Data Interpretation Guide

### Posting Velocity
- **Definition**: Postings per hour on that date
- **Interpretation**: Higher = more active board, more hiring
- **Example**: LinkedIn at 118.6/hr = ~2,847 postings across 24 hours

### Entry/Mid/Senior %
- **Definition**: Percentage of postings in each seniority level (inferred from title)
- **Interpretation**: Shows what level of roles each board focuses on
- **LinkedIn example**: 22% entry, 48% mid, 30% senior = balanced

### Remote %
- **Definition**: Percentage of postings that allow remote work (inferred from description)
- **Interpretation**: Shows board's remote-friendliness
- **Example**: We Work Remotely = 92% remote (expected)

### Company Concentration
- **Definition**: % of top 10 companies out of total postings
- **Interpretation**: > 30% = concentrated (few big companies), < 15% = diverse
- **Use case**: LinkedIn (high concentration) vs Indeed (diverse)

### Top Companies
- **Definition**: Most active companies posting on that board
- **Interpretation**: Who's hiring most aggressively that day
- **Use case**: Identify competitors or major hiring announcements

## Common Queries

### Find boards with most posting activity
Sort by "New Postings" column in descending order

### Find fastest-growing boards
Sort by "Posting Velocity/hr" in descending order

### Find remote-friendly job boards
Use "Remote Filter" → "Remote-Heavy (50%+)"

### Find entry-level hiring opportunities
Use "Seniority Focus" → "Entry-Heavy (30%+)"

### Analyze company hiring patterns
Check "Top Companies Across All Boards" section

## Troubleshooting

### No data shows up
- Verify migrations 025 & 026 were deployed to Supabase
- Check that seed data was inserted: `SELECT COUNT(*) FROM daily_board_activity`
- Verify API endpoint returns data: `/api/pm/daily-feed?date=2026-02-24`

### Ingestion script fails
- Check environment variables are set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Verify Supabase tables exist: `\d daily_board_activity`
- Check database has job postings to aggregate
- Review script logs for specific error

### API returns 404
- Verify date format is YYYY-MM-DD
- Check that data exists for that date in database
- Try date 2026-02-24 which has seed data

### Component shows "Error Loading Feed"
- Check browser console for error details
- Verify API endpoint is accessible
- Check authentication (component is protected route)
- Try accessing directly: `/api/pm/daily-feed`

## Enhancement Ideas

### Short-term
- Add CSV/Excel export for reports
- Email summaries to stakeholders weekly
- Add alerts for unusual activity (concentration spike, velocity change)

### Medium-term
- Trending analysis (week-over-week, month-over-month)
- Predictive metrics (forecast next week's posting volume)
- Benchmarking (compare to historical averages)
- Per-board drill-down views

### Long-term
- ML-powered job matching recommendations
- Salary insights by board/role/seniority
- Hiring velocity predictions
- Market saturation analysis

## File Structure
```
scripts/
  computeDailyBoardActivity.ts      # Ingestion script

src/
  pages/
    api/
      pm/
        daily-feed.ts               # API endpoint
    dashboard/
      pm-analytics.tsx              # Dashboard page
  components/
    PMDailyFeed.tsx                 # React component

supabase/
  migrations/
    025_create_daily_board_activity.sql  # Schema
    026_seed_daily_board_activity.sql    # Test data
```

## Support
For issues or questions about the PM Daily Board Activity Feed feature, review the troubleshooting section or check the implementation files for detailed comments.
