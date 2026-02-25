# Job Board Scraper Setup Guide

## Overview

This system scrapes actual job posting counts from major job boards **twice daily** (8 AM and 6 PM UTC) and stores results in the database.

## Architecture

```
Cron Job (GitHub Actions / Railway)
    ↓
/api/cron/scrape-job-boards endpoint
    ↓
jobBoardScraper.ts (Puppeteer + Cheerio)
    ↓
Supabase: job_board_scrape_results table
    ↓
Dashboard displays live job board metrics
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install puppeteer @supabase/supabase-js
```

### 2. Set Environment Variables

Add to `.env.local`:

```
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Create Database Table

Run the migration:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run the SQL from:
# supabase/migrations/005_job_board_scrape_results.sql
```

### 4. Choose a Cron Provider

#### Option A: GitHub Actions (Recommended)

The workflow is already configured in `.github/workflows/scrape-job-boards.yml`

**Setup:**
1. Add secrets to your GitHub repo:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. The jobs run automatically at 8 AM and 6 PM UTC

#### Option B: Railway

If using Railway for deployment:

1. Update `railway.json` to include cron jobs (see config/cronJobs.ts)
2. Set `CRON_SECRET` as a Railway environment variable
3. Railway will execute the cron jobs

#### Option C: External Cron Service (EasyCron, Cronitor, etc.)

Use a service like EasyCron to POST to:

```
POST https://your-domain.com/api/cron/scrape-job-boards
Header: Authorization: Bearer YOUR_CRON_SECRET
```

### 5. Monitor Results

View scrape results in three ways:

**Database table:**
```sql
SELECT * FROM job_board_scrape_results 
ORDER BY scraped_at DESC 
LIMIT 20;
```

**Latest counts (view):**
```sql
SELECT * FROM latest_job_counts;
```

**API endpoint (test mode):**
```bash
curl "http://localhost:3000/api/cron/scrape-job-boards?secret=YOUR_CRON_SECRET"
```

## Scraped Boards

Currently configured to scrape:
- LinkedIn (ID: 1)
- Stack Overflow Jobs (ID: 2)
- GitHub Jobs (ID: 3)
- AngelList Talent (ID: 4)
- Hired (ID: 5)
- Built In (ID: 6)
- Dice (ID: 7)
- Indeed (ID: 16)
- Glassdoor (ID: 17)
- FlexJobs (ID: 28)

**Add more boards** by editing `scripts/scrapers/jobBoardScraper.ts` and adding to `SCRAPE_CONFIGS` array.

## Troubleshooting

### Scraper Fails on Specific Site
- The site may have anti-bot protection
- Try adjusting timeouts in `jobBoardScraper.ts`
- Check if the CSS selector changed

### "Unauthorized" Error
- Verify `CRON_SECRET` matches in GitHub secrets and code
- Check Authorization header format: `Bearer {secret}`

### Puppeteer Issues
- Install Chromium separately: `npm install @types/puppeteer`
- On Linux servers: `apt-get install chromium-browser`

### Database Connection Fails
- Verify Supabase credentials
- Check database table was created with migration
- Ensure service role key has insert permissions

## Advanced Configuration

### Adjust Scrape Schedule

Edit `.github/workflows/scrape-job-boards.yml`:

```yaml
schedule:
  - cron: '0 8 * * *'   # Morning (8 AM UTC)
  - cron: '0 18 * * *'  # Evening (6 PM UTC)
  # Add more times:
  # - cron: '0 12 * * *' # Noon
  # - cron: '0 0 * * *'  # Midnight
```

### Custom Scraping Logic

Add board-specific extractors in `SCRAPE_CONFIGS`:

```typescript
{
  boardId: 99,
  boardName: 'MyBoard',
  url: 'https://myboard.com/jobs',
  extractFn: (html: string) => {
    const match = html.match(/found (\d+) jobs/i)
    return match ? parseInt(match[0]) : null
  }
}
```

### Disable Specific Boards

Comment out entries in `SCRAPE_CONFIGS` to skip them:

```typescript
// {
//   boardId: 16,
//   boardName: 'Indeed',
//   ...
// }
```

## Limits & Considerations

⚠️ **Important:**

1. **Rate Limiting:** Script uses 2-second delays between requests
2. **Terms of Service:** Some boards prohibit scraping in their ToS
3. **Data Freshness:** Results stored in database with timestamps
4. **Failure Handling:** Gracefully handles sites that block or fail
5. **Cost:** Puppeteer uses resources; monitor function/container limits

## Next Steps

1. Set up GitHub Actions secrets
2. Run migration to create database table
3. Test with: `/api/cron/scrape-job-boards?secret=YOUR_CRON_SECRET`
4. Verify results appear in `job_board_scrape_results` table
5. Create dashboard display component for live data

## Dashboard Integration

To display live scrape data on the insights page:

```typescript
const { data: latestCounts } = await supabase
  .from('latest_job_counts')
  .select('*')

const { data: allResults } = await supabase
  .from('job_board_scrape_results')
  .select('*')
  .order('scraped_at', { ascending: false })
  .limit(70)
```

See `src/pages/dashboard/insights.tsx` for integration example.
