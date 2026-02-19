# Day 9: Compute Posting Lifespan Metrics

## Overview
Today we implement **advanced lifespan metrics and analytics**. Building on Day 6's lifespan tracking and Day 8's pipeline infrastructure, we now compute rich statistics, trends, and comparisons to reveal hiring efficiency patterns.

**Key Insight:** Lifespan is a primary signal of hiring efficiency:
- Short lifespan (< 15 days) = High efficiency, strong candidate pipeline
- Long lifespan (> 45 days) = Difficulty filling role, potential quality issues
- Median tracking reveals board health trends

## Key Components

### 1. `src/lib/lifespanMetrics.ts`
Advanced lifespan analytics engine with 8 main functions.

**Key Functions:**
```typescript
// Single board metrics
getBoardLifespanMetrics(jobBoardId: number): Promise<LifespanMetrics>

// All boards
getAllBoardsLifespanMetrics(): Promise<LifespanMetrics[]>

// Trends over time
getLifespanTrends(jobBoardId?, days = 30): Promise<LifespanTrend[]>

// Distribution bucketing
getLifespanDistribution(jobBoardId): Promise<LifespanBucket[]>

// By role family
getLifespanByRoleFamily(limit = 20): Promise<RoleFamilyLifespan[]>

// Rankings
getRankedBoardsByLifespan(): Promise<Array<LifespanMetrics & {rank}>>

// Comparison
compareLifespans(boardId1, boardId2): Promise<{board1, board2}>

// Percentile rank
getBoardPercentileRank(boardId): Promise<{percentile}>
```

**Data Structures:**

`LifespanMetrics`:
- `boardId`: number
- `boardName`: string
- `avgLifespan`: number
- `medianLifespan`: number
- `p25Lifespan`: number (25th percentile)
- `p75Lifespan`: number (75th percentile)
- `minLifespan`: number
- `maxLifespan`: number
- `totalPostings`: number
- `activeDaysAvg`: number (age of currently-active postings)

`LifespanTrend`:
- `date`: Date
- `boardId`: number
- `boardName`: string
- `avgLifespan`: number
- `postingCount`: number
- `newPostings`: number
- `disappearedPostings`: number

`LifespanBucket`:
- `range`: string (e.g., "0-7 days")
- `min`: number
- `max`: number
- `count`: number (postings in bucket)
- `percentage`: number (% of total)

`RoleFamilyLifespan`:
- `roleFamily`: string
- `avgLifespan`: number
- `medianLifespan`: number
- `totalPostings`: number
- `distinctBoards`: number
- `mostCommonBoard`: string

### 2. `src/pages/api/lifespanMetrics.ts`
REST API for lifespan metrics queries.

**Endpoints:**

`GET /api/lifespanMetrics?boardId=5`
- Single board metrics
- Response: `{success, data: LifespanMetrics}`

`GET /api/lifespanMetrics?action=all`
- All boards metrics
- Response: `{success, data: LifespanMetrics[]}`

`GET /api/lifespanMetrics?action=ranked`
- Ranked boards by lifespan
- Response: `{success, data: Array<LifespanMetrics & {rank}>}`

`GET /api/lifespanMetrics?boardId=5&action=trends&days=30`
- Lifespan trends (30-day default)
- Response: `{success, data: LifespanTrend[]}`

`GET /api/lifespanMetrics?boardId=5&action=distribution`
- Distribution buckets
- Response: `{success, data: LifespanBucket[]}`

`GET /api/lifespanMetrics?action=by-role`
- Top 20 role families by lifespan
- Response: `{success, data: RoleFamilyLifespan[]}`

`GET /api/lifespanMetrics?boardId=5&action=percentile`
- Percentile rank
- Response: `{success, data: {boardId, boardName, avgLifespan, percentile}}`

`GET /api/lifespanMetrics?boardId=5&boardId2=8&action=compare`
- Compare two boards
- Response: `{success, data: {board1, board2}}`

### 3. `src/components/LifespanMetricsDisplay.tsx`
React components for visualizing metrics.

**Components:**

`<LifespanMetricsCard metrics={metrics} />`
- Single board card with all key statistics
- Percentile display
- Active posting age

`<LifespanRanking metrics={ranked} />`
- Ranked list of boards (1st, 2nd, 3rd badges)
- Sorted by longest avg lifespan
- Shows posting count

`<LifespanDistributionChart buckets={buckets} boardName={name} />`
- Histogram showing distribution across time buckets
- Visual bar chart with percentages
- 6 buckets: 0-7d, 8-14d, 15-30d, 31-60d, 61-90d, 90+d

`<RoleFamilyLifespanTable data={roles} />`
- Table of role families sorted by avg lifespan
- Shows median, posting count, board diversity
- Scrollable for many roles

`<LifespanComparison board1={m1} board2={m2} />`
- Side-by-side comparison of two boards
- Calculates difference and percentages
- Highlights which is better

### 4. `scripts/computeLifespanMetrics.ts`
Command-line analysis and reporting tool.

**Usage:**
```bash
npx ts-node scripts/computeLifespanMetrics.ts

# Output:
# ════════════════════════════════════════════════════════════════════════════════
# POSTING LIFESPAN METRICS ANALYSIS
# ════════════════════════════════════════════════════════════════════════════════
# 
# 📊 OVERALL STATISTICS
# ────────────────────────────────────────────────────────────────────────────────
# Total Job Boards: 33
# Total Postings Analyzed: 5,234
#
# Average Lifespan (Across All Boards): 28.4 days
# Average Median Lifespan: 21.0 days
#
# 🏆 TOP PERFORMERS (Longest Average Lifespan)
# ────────────────────────────────────────────────────────────────────────────────
# 🥇  1. Stack Overflow                     42.5d avg (450 postings)
# 🥈  2. GitHub Jobs                        39.2d avg (187 postings)
# 🥉  3. AngelList                          38.7d avg (156 postings)
#    4. We Work Remotely                    35.1d avg (142 postings)
#    5. Dribbble                            34.8d avg (89 postings)
# ...
#
# ⏱️  SLOWEST BOARDS (Shortest Average Lifespan)
# ────────────────────────────────────────────────────────────────────────────────
#   29. Hired                                 8.3d avg (234 postings)
#   30. Blind                                 7.9d avg (45 postings)
#   31. Idealist.org                         6.2d avg (78 postings)
#   32. ProBlogger                           5.8d avg (123 postings)
#   33. Design Observer                      4.1d avg (156 postings)
#
# 👔 ROLE FAMILY ANALYSIS (Top 10)
# ────────────────────────────────────────────────────────────────────────────────
# software-engineer              38.5d avg |  34d median |  1450 postings | 33 boards
# product-manager                35.2d avg |  30d median |   456 postings | 29 boards
# data-scientist                 32.1d avg |  28d median |   378 postings | 26 boards
# ...
```

### 5. `supabase/migrations/005_lifespan_metrics.sql`
Database views for efficient analytics.

**Views:**
- `board_lifespan_stats` - Per-board statistics
- `role_family_lifespan_stats` - Per-role-family statistics
- `daily_lifespan_trends` - Historical daily tracking
- `lifespan_percentile_rankings` - Percentile rankings
- `lifespan_distribution_buckets` - Bucketed distributions
- `lifespan_metrics_snapshot` - Materialized view (cached)

**Indexes:**
- On `lifespan_days`, `first_seen`, `last_seen`
- On `normalized_title` for role family queries
- Optimized for trend and percentile calculations

## Metrics & Interpretation

### Average Lifespan as Efficiency Indicator

| Lifespan | Interpretation | Health |
|----------|-----------------|--------|
| < 7 days | Exceptional hiring efficiency | 🟢 Excellent |
| 7-15 days | Strong candidate pipeline | 🟢 Good |
| 15-30 days | Normal hiring cycle | 🟡 Average |
| 30-45 days | Difficulty filling | 🟠 Concerning |
| > 45 days | Significant hiring challenges | 🔴 Poor |

### Role Family Insights

**Longest Lifespan Roles:**
- Specialized technical roles (machine learning engineers, blockchain devs)
- Niche industries (aviation, maritime)
- Executive positions (C-suite, board members)

**Shortest Lifespan Roles:**
- High-demand entry-level (junior developer, coordinator)
- Popular general roles (customer success, business development)
- High-turnover sectors (retail, food service)

### Board Efficiency Rankings

**Framework for scoring:**
```
Efficiency Score = 100 - (avgLifespan / maxLifespan * 100)

Example:
- Board A: 15 days avg, 90 max = 100 - (15/90 * 100) = 83/100
- Board B: 45 days avg, 90 max = 100 - (45/90 * 100) = 50/100
```

## Advanced Queries

```sql
-- Boards above/below median lifespan
SELECT name, avg_lifespan,
  CASE 
    WHEN avg_lifespan > (SELECT AVG(avg_lifespan) FROM board_lifespan_stats)
      THEN 'Above Average'
    ELSE 'Below Average'
  END as status
FROM board_lifespan_stats;

-- Week-over-week lifespan trend
SELECT 
  DATE_TRUNC('week', snapshot_date)::DATE as week,
  job_board_id,
  ROUND(AVG(avg_lifespan_at_date), 1) as weekly_avg_lifespan,
  LAG(ROUND(AVG(avg_lifespan_at_date), 1)) OVER (
    PARTITION BY job_board_id ORDER BY DATE_TRUNC('week', snapshot_date)
  ) as prev_week_avg,
  ROUND(AVG(avg_lifespan_at_date) - LAG(ROUND(AVG(avg_lifespan_at_date), 1)) OVER (
    PARTITION BY job_board_id ORDER BY DATE_TRUNC('week', snapshot_date)
  ), 1) as trend
FROM daily_lifespan_trends
GROUP BY week, job_board_id;

-- Role families with improving hiring
SELECT 
  role_family,
  current_month_avg,
  previous_month_avg,
  current_month_avg - previous_month_avg as improvement
FROM role_family_monthly_trends
WHERE current_month_avg < previous_month_avg
ORDER BY improvement DESC;
```

## Workflow: Computing Lifespan Metrics Daily

**Via Day 8 Pipeline (Phase 5):**
```typescript
// In pipelineOrchestrator.ts, Phase 5: Compute Metrics
async computeMetrics(): Promise<any> {
  // Pre-computed by views, just refresh materialized views
  await supabase.rpc('refresh_lifespan_snapshot')
  
  // Compute trend data
  const trends = await getLifespanTrends()
  
  // Store current metrics
  await createMetricsSnapshot({
    date: new Date(),
    boardMetrics: await getAllBoardsLifespanMetrics(),
    roleMetrics: await getLifespanByRoleFamily(50),
  })
}
```

## Integration with Scoring (Day 11)

Lifespan metrics become primary input for efficiency scoring:

```typescript
const lifespanScore = (maxMedianLifespan - boardMedianLifespan) / maxMedianLifespan * 100

// Example:
// Max median across all boards: 35 days
// Board's median: 12 days
// Score: (35 - 12) / 35 * 100 = 65 points out of 40% weight
```

## Files Modified/Created
- ✨ `src/lib/lifespanMetrics.ts` - Analytics engine (378 lines)
- ✨ `src/pages/api/lifespanMetrics.ts` - REST API (85 lines)
- ✨ `src/components/LifespanMetricsDisplay.tsx` - React components (368 lines)
- ✨ `scripts/computeLifespanMetrics.ts` - Analysis script (109 lines)
- ✨ `supabase/migrations/005_lifespan_metrics.sql` - DB views & indexes (110 lines)

**Total: 5 new files, 1,050 lines of code**

## Next Step (Day 10)

**Compute Repost Frequency Metrics**
- Calculate repost rate percentage per board
- Count total reposts (cumulative)
- Identify boards with chronic reposting issues
- Build trend tracking for repost frequency changes
- Create comparison views with lifespan for correlation analysis
