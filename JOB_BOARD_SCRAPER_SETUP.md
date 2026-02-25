# Job Board Scraper Setup Guide (Netlify + GitHub Actions)

## Overview

This system scrapes actual job posting counts from major job boards **twice daily** (8 AM and 6 PM UTC) and stores results in the database. Uses **GitHub Actions** for reliable cron scheduling with **Netlify** for deployment.

## Architecture

```
GitHub Actions (Cron Job)
    ↓
/api/cron/scrape-job-boards endpoint (Netlify)
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

Add to Netlify environment variables (Settings → Build & Deploy → Environment):
- `CRON_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Create Database Table

Run the migration:

```bash
# Using Supabase CLI
supabase migration up

# Or manually run the SQL from:
# supabase/migrations/005_job_board_scrape_results.sql
```

### 4. GitHub Actions Setup (Recommended for Netlify)

The workflow is already configured in `.github/workflows/scrape-job-boards.yml`

**Setup:**
1. Add secrets to your GitHub repo (Settings → Secrets and variables → Actions):
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `CRON_SECRET` - A secure random string for API authentication

2. The jobs run automatically at 8 AM and 6 PM UTC every day

3. The workflow POST requests to your Netlify-deployed app:
   ```
   https://your-app.netlify.app/api/cron/scrape-job-boards
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

**API endpoint (test mode on localhost):**
```bash
curl "http://localhost:3000/api/cron/scrape-job-boards?secret=YOUR_CRON_SECRET"
```

**Test on Netlify deployment:**
```bash
# Set your CRON_SECRET in Netlify env vars, then:
curl "https://your-app.netlify.app/api/cron/scrape-job-boards?secret=YOUR_CRON_SECRET"
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

### GitHub Actions Workflow Not Running
- Check `.github/workflows/scrape-job-boards.yml` is in main branch
- Go to GitHub repo → Actions → Scrape Job Boards → See workflow status
- If not running, click "Enable workflow"

### Scraper Fails on Specific Site
- The site may have anti-bot protection
- Try adjusting timeouts in `jobBoardScraper.ts`
- Check if the CSS selector changed on the site

### "Unauthorized" Error
- Verify `CRON_SECRET` is set in GitHub Actions secrets
- Confirm the same secret is in Netlify environment variables
- Check Authorization header format: `Bearer {secret}`

### Puppeteer Issues
- Ensure dependencies installed: `npm install puppeteer`
- On Netlify build, Puppeteer usually works out of box
- Check build logs: Netlify Dashboard → Deploys → Build logs

### Database Connection Fails
- Verify Supabase credentials in GitHub secrets
- Check database table was created with migration
- Ensure service role key has insert permissions
- Test connection: `curl -X POST ... -v` to see response

### Scraper Timeout on Netlify Function
- GitHub Actions makes HTTP requests (no function timeout)
- Netlify Functions have 26-second timeout for free tier
- Split scraping into smaller batches if needed

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

Times are in UTC. Adjust for your timezone:
- UTC+0: Use times as-is
- UTC+5 (EST): Subtract 5 hours
- UTC+8 (PST): Subtract 8 hours

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
5. **Execution Time:** GitHub Actions runs are free up to 2000 minutes/month

## Deployment Checklist

- [ ] Puppeteer installed in `package.json`
- [ ] Database migration created for `job_board_scrape_results` table
- [ ] `.github/workflows/scrape-job-boards.yml` in main branch
- [ ] Supabase credentials added to GitHub Actions secrets
- [ ] `CRON_SECRET` set in both GitHub secrets and Netlify environment
- [ ] `/api/cron/scrape-job-boards` endpoint deployed on Netlify
- [ ] Test endpoint returns 200 status with data
- [ ] Results appearing in `job_board_scrape_results` table after first run

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

## Support & Debugging

If scraper isn't working:

1. **Check GitHub Actions logs:** Go to your repo → Actions → Scrape Job Boards → Latest run
2. **Check Netlify function logs:** Go to Netlify Dashboard → Functions → Filter by date
3. **Test manually:** Run `/api/cron/scrape-job-boards?secret=...` from your machine
4. **Check database:** Query `SELECT * FROM job_board_scrape_results ORDER BY created_at DESC LIMIT 5;`

