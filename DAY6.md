# Day 6: Track Posting Lifespan

## Overview
Today we implement comprehensive posting lifespan tracking. This captures when jobs appear, reappear, and disappear—essential data for calculating the hiring efficiency score (40% lifespan component).

**Timeline:** Postings are tracked through:
- **First Sighting** → when a job is first detected
- **Recurrence** → when it's found again in subsequent scrapes  
- **Disappearance** → when it's no longer found (indicating filled position or job closed)

## Key Components

### 1. `src/lib/lifespanTracking.ts`
Core lifespan tracking engine with database operations.

**Key Functions:**
```typescript
// Record when a posting is first sighted
recordFirstSighting(jobPostingId: number): Promise<boolean>

// Update last_seen timestamp (posting still active)
updateLastSeen(jobPostingId: number): Promise<boolean>

// Mark a posting as disappeared
markAsDisappeared(jobPostingId: number): Promise<boolean>

// Calculate lifespan: last_seen - first_seen in days
calculateAndUpdateLifespan(jobPostingId: number): Promise<number>

// Record event (appeared/reappeared/disappeared)
recordPostingEvent(jobPostingId, eventType, notes?): Promise<boolean>

// Get timeline of all events for a posting
getPostingTimeline(jobPostingId: number): Promise<PostingEvent[]>

// Get statistics for a board
getLifespanStatsForBoard(jobBoardId: number): Promise<LifespanStats>

// Get stats for all boards
getAllBoardsLifespanStats(): Promise<LifespanStats[]>

// Bulk update all lifespans
bulkUpdateAllLifespans(): Promise<{updated, failed}>
```

**Data Structures:**

`PostingLifespan`:
- `jobPostingId`: number
- `firstSeen`: Date
- `lastSeen`: Date
- `disappeared`: boolean
- `disappearedAt?`: Date
- `lifespanDays`: number
- `status`: 'active' | 'inactive' | 'disappeared'

`LifespanStats`:
- `boardId`: number
- `boardName`: string
- `totalPostings`: number
- `activePostings`: number
- `disappearedPostings`: number
- `averageLifespan`: number
- `medianLifespan`: number
- `minLifespan`: number
- `maxLifespan`: number
- `byRoleFamily?: Record<string, {count, avgLifespan}>`

### 2. `src/lib/logging/lifespanScraper.ts`
Enhanced BaseScraper with automatic lifespan tracking.

**Extends BaseScraper with:**
- `trackPostingLifespan(jobPostingId, isStillActive, eventNotes?)` - Updates posting status
- `saveListings(listings[])` - Override that tracks lifespan after save
- `markDisappearedPostings(postingIds[], reason?)` - Bulk mark disappearances
- Automatic recording of appeared/reappeared/disappeared events

**Usage Pattern:**
```typescript
class LinkedInScraper extends LifespanScraper {
  async scrape(): Promise<JobListing[]> {
    const found = await this.fetchAndParse()
    return found
    // saveListings() will auto-track lifespan
  }
  
  async run() {
    const result = await super.run()
    // Also mark jobs NOT found as disappeared
    const allKnownIds = await getKnownJobIds(this.jobBoardId)
    const foundIds = result.jobIds
    const disappeared = allKnownIds.filter(id => !foundIds.includes(id))
    await this.markDisappearedPostings(disappeared)
    return result
  }
}
```

### 3. `src/pages/api/lifespanStats.ts`
REST API endpoint for querying lifespan data.

**Endpoints:**

`GET /api/lifespanStats`
- Returns stats for all boards
- Response: `{success, data: LifespanStats[]}`

`GET /api/lifespanStats?boardId=1`
- Returns stats for specific board
- Response: `{success, data: LifespanStats}`

`GET /api/lifespanStats?postingId=123&action=timeline`
- Returns event timeline for a posting
- Response: `{success, data: PostingEvent[]}`

`POST /api/lifespanStats`
- `{action: "update-all"}` - Bulk update all lifespans
- Response: `{success, data: {updated, failed}}`

### 4. `src/components/LifespanAnalytics.tsx`
React components for visualizing lifespan data.

**Components:**

`<LifespanStatsCard stats={stats} />`
- Displays key metrics: total, active, disappeared, avg lifespan
- Role family breakdown table
- Color-coded for quick scanning

`<PostingTimeline events={events} jobPostingId={id} />`
- Visual timeline of posting events
- Chronological order
- Event type (appeared/reappeared/disappeared)
- Timestamps and notes

`<LifespanComparison stats={stats[]} />`
- Bar chart comparing average lifespans across boards
- Sorted by longest lifespan
- Shows active/disappeared counts

`<LifespanDistribution stats={stats} />`
- Histogram of posting lifespans
- Bins: 0-7, 8-14, 15-30, 31-60, 60+ days
- Identifies patterns in posting durations

### 5. `scripts/analyzeLifespans.ts`
Command-line tool for batch analysis and reporting.

**Usage:**
```bash
# Run analysis on all data
npx ts-node scripts/analyzeLifespans.ts

# Output includes:
# - Overall statistics (avg, median across all boards)
# - Per-board breakdown (sorted by avg lifespan)
# - Role family distribution within each board
# - Event statistics

# Example output:
# POSTING LIFESPAN ANALYSIS
# ════════════════════════════════════════════════════════════════════════════════
# 
# 📊 OVERALL STATISTICS
# ─────────────────────────────────────────────────────────────────────────────────
# Total Postings Tracked: 1,234
# Average Lifespan (All Boards): 28.5 days
# Median Lifespan (All Boards): 21 days
#
# 📋 PER-BOARD BREAKDOWN
# ─────────────────────────────────────────────────────────────────────────────────
#
# LinkedIn
#   Total Postings: 450
#   Active: 120 | Disappeared: 330
#   Avg Lifespan: 35.2 days
#   Median: 32 days | Range: 1-180 days
#   By Role Family:
#     - software-engineer: 150 postings, 38.5 days avg
#     - product-manager: 45 postings, 42.1 days avg
#     ...
```

### 6. `supabase/migrations/003_lifespan_tracking.sql`
Database views and indexes for efficient lifespan queries.

**New Views:**
- `active_postings` - Currently available jobs, ordered by most recent
- `disappeared_postings` - Recently removed jobs
- `lifespan_stats_by_board` - Statistics per board (total, avg, median)
- `lifespan_stats_by_role` - Statistics per role family
- `posting_timeline` - Complete event history for all postings

**New Indexes:**
- `idx_postings_lifespan_days` - For lifespan range queries
- `idx_postings_disappeared` - For filtering active/inactive
- `idx_postings_role_family` - For role-based analytics
- `idx_posting_events_type` - For event type filtering

## Integration with Scrapers

When a scraper extends `LifespanScraper` instead of `BaseScraper`:

1. **Automatic first sighting:** When `saveListings()` is called, each posting's first appearance is recorded
2. **Automatic last_seen update:** The current timestamp is set as last_seen
3. **Reappearance detection:** If a posting was marked disappeared, marking it active again records a reappearance event
4. **Lifespan calculation:** When disappearance is recorded, lifespan is calculated as `disappeared_at - first_seen`

**Example Enhanced Implementation:**
```typescript
class IndeedScraper extends LifespanScraper {
  async scrape(): Promise<JobListing[]> {
    const jobs = []
    const pageCount = 3
    
    for (let page = 0; page < pageCount; page++) {
      const pageJobs = await this.fetchUrl(
        `${this.baseUrl}?start=${page * 10}`
      )
      // Parse with Cheerio
      const parsed = this.parseIndeedPage(pageJobs)
      jobs.push(...parsed)
    }
    
    return jobs
    // LifespanScraper.saveListings() will auto-track lifespans
  }
}
```

## Database Schema Changes

**Existing columns utilized:**
- `job_postings.first_seen` - Timestamp of first detection
- `job_postings.last_seen` - Latest detection timestamp
- `job_postings.disappeared` - Boolean flag
- `job_postings.disappeared_at` - Exact disappearance time  
- `job_postings.lifespan_days` - Calculated duration
- `posting_events` table - Tracks all timeline events

**New database views:**  
(See migration file for complete SQL)

## Workflow: How Lifespan Tracking Works

### Daily Scrape Cycle
1. **Morning scrape** runs for each job board
2. For each found job:
   - `recordFirstSighting()` - Sets `first_seen` if new (no-op if already present)
   - `updateLastSeen()` - Updates to current timestamp
3. **Post-scrape cleanup:**
   - Administrator or background job queries known postings not found
   - `markAsDisappeared()` for each missing posting
   - Records disappearance event with reason
4. Lifespan is calculated: `lifespan_days = disappeared_at - first_seen`

### Repost Scenario
- Job disappears on Day 10 (lifespan = 10 days)
- Same job reappears on Day 15
- `markAsDisappeared()` = false, sets `disappeared: false`
- Records 'reappeared' event
- Lifespan recalculated based on new last_seen date
- `repost_count` incremented (Day 7 feature)

## Queries & Analysis

### Common Queries
```sql
-- Average posting lifespan by board
SELECT
  jb.name,
  ROUND(AVG(jp.lifespan_days), 1) as avg_days,
  COUNT(*) as total_postings
FROM job_postings jp
JOIN job_boards jb ON jp.job_board_id = jb.id
WHERE jp.lifespan_days IS NOT NULL
GROUP BY jb.id, jb.name
ORDER BY avg_days DESC;

-- Longest-running postings
SELECT title, company, lifespan_days
FROM job_postings
WHERE lifespan_days IS NOT NULL
ORDER BY lifespan_days DESC
LIMIT 10;

-- Recently disappeared jobs
SELECT title, company, disappeared_at, lifespan_days
FROM job_postings
WHERE disappeared = TRUE
ORDER BY disappeared_at DESC
LIMIT 20;

-- Role family lifespan comparison
SELECT
  normalized_title,
  ROUND(AVG(lifespan_days), 1) as avg_days,
  COUNT(*) as postings
FROM job_postings
WHERE normalized_title IS NOT NULL
GROUP BY normalized_title
ORDER BY avg_days DESC;
```

## Integration Checklist

- [x] Create lifespan tracking service (`lifespanTracking.ts`)
- [x] Create enhanced scraper (`lifespanScraper.ts`)
- [x] Create API endpoint (`lifespanStats.ts`)
- [x] Create React components (`LifespanAnalytics.tsx`)
- [x] Create analysis script (`analyzeLifespans.ts`)
- [x] Create database views and indexes (`003_lifespan_tracking.sql`)
- [ ] Update real scraper implementations to extend LifespanScraper
- [ ] Test with sample data
- [ ] Deploy migrations to Supabase
- [ ] Dashboard integration (Day 15+)

## Next Steps (Day 7)

Tomorrow we implement **repost detection and validation**:
- Identify when the same posting reappears after disappearing
- Increment `repost_count` in database
- Implement posting linkage (grouping reposts by URL/title similarity)
- Build validation queries to test repost logic
- Enhance UI to highlight boards with frequent reposts

This combined with today's lifespan tracking provides the foundation for calculating hiring effectiveness scores.

## Files Modified/Created
- ✨ `src/lib/lifespanTracking.ts` - Core service (432 lines)
- ✨ `src/lib/logging/lifespanScraper.ts` - Enhanced scraper (86 lines)
- ✨ `src/pages/api/lifespanStats.ts` - API endpoint (69 lines)
- ✨ `src/components/LifespanAnalytics.tsx` - React components (349 lines)
- ✨ `scripts/analyzeLifespans.ts` - Analysis script (101 lines)
- ✨ `supabase/migrations/003_lifespan_tracking.sql` - DB views & indexes (67 lines)

**Total: 6 new files, 1,104 lines of code**
