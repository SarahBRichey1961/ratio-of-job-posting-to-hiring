# Real Job Board Data Collection Setup

This document explains how to set up real data collection for the job board metrics system.

## Architecture Overview

The system collects real data through three methods:
1. **Public APIs** - Stack Overflow, LinkedIn, GitHub (where available)
2. **Web Scraping** - Indeed, Glassdoor, other boards without APIs
3. **Estimated Data** - Boards without public data sources (using industry averages)

## Components

### 1. Job Board Scraper (`src/lib/scrapers/jobBoardScraper.ts`)
Contains functions to scrape or fetch data from each job board:
- `scrapeStackOverflow()` - Uses Stack Overflow API
- `scrapeIndeed()` - Web scraping with Cheerio
- `scrapeGlassdoor()` - Web scraping
- Plus fallback estimations for other boards

### 2. Database Schema (`src/lib/database/migrations/003_job_board_metrics.ts`)
Two tables:
- `job_board_metrics` - Latest metrics for each board
- `job_board_metrics_history` - Historical trends

### 3. API Endpoints

#### `GET /api/metrics`
Retrieves the latest metrics for all job boards or a specific board.

**Query Parameters:**
- `boardName` (optional) - Filter by board name

**Response:**
```json
[
  {
    "id": "uuid",
    "board_name": "Stack Overflow",
    "total_postings": 8500,
    "avg_lifespan_days": 28,
    "response_rate": null,
    "acceptance_rate": null,
    "data_source": "api",
    "collected_date": "2026-02-20T10:00:00Z"
  }
]
```

#### `POST /api/metrics/collect`
Manually trigger metrics collection.

**Request Body:**
```json
{
  "boardName": "Stack Overflow",
  "metrics": {
    "totalPostings": 8500,
    "avgLifespanDays": 28,
    "responseRate": 0.65,
    "acceptanceRate": null,
    "dataSource": "api"
  }
}
```

### 4. Cron Job (`src/pages/api/cron/collect-metrics.ts`)
Runs daily at 2 AM UTC to collect fresh data from all 36 job boards.

## Setup Instructions

### Step 1: Deploy Database Migrations

Run in Supabase SQL Editor:
```sql
-- Create tables for storing metrics
CREATE TABLE IF NOT EXISTS job_board_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  total_postings INTEGER,
  avg_lifespan_days INTEGER,
  response_rate DECIMAL,
  acceptance_rate DECIMAL,
  data_source TEXT,
  collected_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_name, collected_date::date)
);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_board_name 
  ON job_board_metrics(board_name);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_collected_date 
  ON job_board_metrics(collected_date DESC);

CREATE TABLE IF NOT EXISTS job_board_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  metric_date DATE NOT NULL,
  total_postings INTEGER,
  avg_lifespan_days INTEGER,
  response_rate DECIMAL,
  acceptance_rate DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_name, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_job_board_metrics_history_board_name 
  ON job_board_metrics_history(board_name);
```

### Step 2: Configure Environment Variables

On Railway (or your hosting platform), ensure these are set:
```
NEXT_PUBLIC_SUPABASE_URL=https://blhrazwlfzrclwaluqak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Trigger Initial Data Collection

Make a request to your deployed app:
```bash
curl https://your-app.railway.app/api/cron/collect-metrics
```

This will collect metrics from all 36 job boards and store them in Supabase.

### Step 4: Set Up Daily Collection (Optional)

If using Railway with cron support, add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/collect-metrics",
    "schedule": "0 2 * * *"
  }]
}
```

Or use an external cron service like EasyCron or AWS EventBridge.

## Data Sources & Quality

### Scraping Success Rates

**Reliable (High Success):**
- Stack Overflow API - Direct API access
- GitHub Jobs - Public data

**Moderate Success:**
- Indeed - Web scraping (May require rate limiting)
- Glassdoor - Web scraping (May require headers)

**Estimated:**
- LinkedIn, WellFound, AngelList, and others without public APIs use industry-standard estimates or cached data

### Response Times

- Stack Overflow API: ~500ms
- Web scraping: ~2-5s per site
- Total collection time: 5-30 seconds for all boards
- Cron job will execute periodically without blocking

## Displaying Real Data

The dashboard components now fetch data from `/api/metrics`:

### In React Components:

```tsx
import { useJobBoardMetrics } from '@/hooks/useJobBoardMetrics'

export function MyComponent() {
  const { metrics, loading, error } = useJobBoardMetrics()

  if (loading) return <div>Loading metrics...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {metrics.map(metric => (
        <div key={metric.board_name}>
          <h3>{metric.board_name}</h3>
          <p>Total Postings: {metric.total_postings}</p>
          <p>Avg Lifespan: {metric.avg_lifespan_days} days</p>
        </div>
      ))}
    </div>
  )
}
```

## Scoring System

Raw metrics are converted to Job Board Scores (0-100) using:

- **Listing Volume** (35%): More postings = higher score
- **Posting Quality/Lifespan** (25%): Longer-lived postings = better quality
- **Response Rate** (20%): Higher engagement = better match
- **Acceptance Rate** (20%): Higher acceptance = quality applicants

Use `calculateBoardScore()` from `src/lib/scoring/boardScoring.ts`:

```tsx
import { calculateBoardScore } from '@/lib/scoring/boardScoring'

const score = calculateBoardScore({
  name: 'Stack Overflow',
  totalPostings: 8500,
  avgLifespanDays: 28,
  responseRate: 0.65,
  acceptanceRate: 0.35
})

console.log(`Score: ${score.score}/100, Grade: ${score.grade}`)
```

## Troubleshooting

### "supabaseKey is required" Error
- Ensure `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check that URL doesn't have typos

### Scraping Returns Empty Data
- Some boards may have rate limiting
- Consider adding proxy/header rotation
- Check if selectors have changed

### API Returns 500 Error
- Check Supabase credentials
- Verify database tables exist (run migrations)
- Check logs for specific errors

## Next Steps

1. Deploy to Railway
2. Run database migrations
3. Trigger initial data collection
4. Set up daily cron jobs
5. Monitor data quality in Supabase dashboard
6. Update dashboard pages to use `useJobBoardMetrics()` hook
