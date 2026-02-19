# Day 10: Compute Repost Frequency Metrics

## Overview
Today we implement **repost frequency analysis** to quantify data duplication issues. Building on Day 7's repost detection and Day 9's lifespan metrics, we now compute statistical metrics that reveal how often postings are reposted and which boards have the cleanest data.

**Key Insight:** Repost frequency is a critical data quality metric:
- Low repost rate (< 5%) = Excellent data quality, minimal duplication
- Moderate repost rate (5-15%) = Good quality, acceptable for analysis
- High repost rate (> 30%) = Data quality concerns, scraping frequency issues

## Key Components

### 1. `src/lib/repostFrequency.ts`
Advanced repost frequency analytics engine with 8 main functions.

**Key Functions:**
```typescript
// Single board metrics
getBoardRepostFrequency(jobBoardId: number): Promise<RepostFrequencyMetrics>

// All boards
getAllBoardsRepostFrequency(): Promise<RepostFrequencyMetrics[]>

// Trends over time
getRepostTrends(jobBoardId?, days = 30): Promise<RepostTrend[]>

// By role family
getRepostFrequencyByRoleFamily(limit = 20): Promise<RoleRepostFrequency[]>

// Rankings (best to worst)
getRankedBoardsByRepostFrequency(): Promise<Array<RepostFrequencyMetrics & {rank, healthScore}>>

// Severity assessment
getRepostSeverity(boardId): Promise<{severity, description, recommendation}>

// Top reposted postings
getTopRepostedPostings(boardId, limit = 10): Promise<Array<{postingId, title, company, repostCount, daysActive}>>

// Posting's boards
getRepostingBoardsForPosting(postingId): Promise<Array<{boardId, boardName, firstSeen, lastSeen, daysPresent}>>
```

**Data Structures:**

`RepostFrequencyMetrics`:
- `boardId`: number
- `boardName`: string
- `totalPostings`: number
- `totalReposts`: number (cumulative repost events)
- `repostRate`: number (% of postings with at least 1 repost)
- `avgRepostsPerPosting`: number
- `maxRepostsForSinglePosting`: number (highest repost count)
- `uniqueRepostedPostings`: number (count with repost_count > 0)
- `repastedOffenders`: number (count with repost_count >= 3)

`RoleRepostFrequency`:
- `roleFamily`: string
- `totalPostings`: number
- `repostedCount`: number
- `repostRate`: number
- `avgRepostsPerPosting`: number
- `distinctBoards`: number
- `worstBoard`: string

`RepostSeverity`:
- Excellent: < 5% repost rate
- Good: 5-15%
- Moderate: 15-30%
- Concerning: 30-50%
- Critical: > 50%

### 2. `src/pages/api/repostFrequency.ts`
REST API for repost frequency queries.

**Endpoints:**

`GET /api/repostFrequency?boardId=5`
- Single board metrics
- Response: `{success, data: RepostFrequencyMetrics}`

`GET /api/repostFrequency?action=all`
- All boards metrics
- Response: `{success, data: RepostFrequencyMetrics[]}`

`GET /api/repostFrequency?action=ranked`
- Ranked boards (best to worst)
- Response: `{success, data: Array<RepostFrequencyMetrics & {rank, healthScore}>}`

`GET /api/repostFrequency?boardId=5&action=trends&days=30`
- Repost trends (30-day default)
- Response: `{success, data: RepostTrend[]}`

`GET /api/repostFrequency?action=by-role`
- Top 20 role families by repost rate
- Response: `{success, data: RoleRepostFrequency[]}`

`GET /api/repostFrequency?boardId=5&action=severity`
- Severity assessment for board
- Response: `{success, data: {severity, description, recommendation}}`

`GET /api/repostFrequency?boardId=5&action=top-reposted&limit=10`
- Most reposted postings
- Response: `{success, data: Array<{postingId, title, company, repostCount, daysActive}>}`

`GET /api/repostFrequency?postingId=xyz&action=reposting-boards`
- All boards that have this posting
- Response: `{success, data: Array<{boardId, boardName, firstSeen, lastSeen, daysPresent}>}`

`GET /api/repostFrequency?boardId=5&boardId2=8&action=compare`
- Compare two boards
- Response: `{success, data: {board1, board2}}`

### 3. `src/components/RepostFrequencyDisplay.tsx`
React components for visualizing repost metrics.

**Components:**

`<RepostFrequencyCard metrics={metrics} />`
- Single board card with all key statistics
- Health score (100 - repostRate * 2)
- Shows chronic reposters count

`<HealthIndicator healthScore={score} severity={level} />`
- Color-coded severity indicator
- 5-level system with emoji badges
- Recommendation text

`<RepostRanking metrics={ranked} />`
- Ranked list of boards (best to worst)
- Shows repost rate and health score
- Visual ranking numbers

`<RoleRepostFrequencyTable data={roles} />`
- Table of role families sorted by repost rate
- Shows repost count, percentage, average
- Links to worst board for that role

`<TopRepostedPostings boardName={name} postings={data} />`
- Table of most-reposted postings
- Shows company, repost count, days active
- Sortable and filterable

`<RepostFrequencyComparison board1={m1} board2={m2} />`
- Side-by-side comparison of two boards
- Calculates difference
- Indicates which has better data quality

### 4. `scripts/computeRepostFrequency.ts`
Command-line analysis and reporting tool.

**Usage:**
```bash
npx ts-node scripts/computeRepostFrequency.ts

# Output:
# ════════════════════════════════════════════════════════════════════════════════
# REPOST FREQUENCY METRICS ANALYSIS
# ════════════════════════════════════════════════════════════════════════════════
#
# 📊 OVERALL STATISTICS
# ────────────────────────────────────────────────────────────────────────────────
# Total Job Boards: 33
# Total Postings Analyzed: 5,234
# Total Repost Events: 1,247
# Postings with Reposts: 892
#
# Average Repost Rate (Across All Boards): 17.0%
# Global Repost Rate: 23.8%
#
# 🏆 CLEANEST BOARDS (Lowest Repost Rate)
# ────────────────────────────────────────────────────────────────────────────────
# 🥇  1. Hired                                  2.1% (432 postings) [Health: 96]
# 🥈  2. LinkedIn                               3.5% (1,203 postings) [Health: 93]
# 🥉  3. Indeed                                 4.2% (879 postings) [Health: 92]
#    4. Glassdoor                               5.8% (456 postings) [Health: 88]
#    5. BrushDown                               6.1% (234 postings) [Health: 88]
# ...
#
# ⚠️  DIRTIEST BOARDS (Highest Repost Rate)
# ────────────────────────────────────────────────────────────────────────────────
#   29. Crunchboard                            42.1% (123 postings) [Health: 16]
#   30. Idealist.org                           45.3% (89 postings) [Health: 9]
#   31. ProBlogger                             51.2% (145 postings) [Health: 2]
#   32. Design Observer                        58.9% (67 postings) [Health: -18]  (would clamp to 0)
#
# 👔 REPOST FREQUENCY BY ROLE FAMILY (Top 10)
# ────────────────────────────────────────────────────────────────────────────────
# software-engineer                  12.3% | 156 of 1450 |  Avg: 0.18x | 33 boards
# product-manager                    18.5% |  84 of  456 |  Avg: 0.25x | 29 boards
# data-scientist                     22.1% |  83 of  378 |  Avg: 0.32x | 26 boards
# ...
#
# 🔍 DATA QUALITY ASSESSMENT
# Top performers severity distribution:
#   EXCELLENT: 4 boards
#   GOOD: 3 boards
#   MODERATE: 2 boards
#   CONCERNING: 1 board
#
# 💡 INTERPRETATION GUIDE
#
# ✅ EXCELLENT BOARDS (<5% repost rate):
#    Hired, LinkedIn, Indeed
#    These boards have exceptional data quality.
#    Suitable for detailed analysis and reporting.
#
# 🚨 PROBLEMATIC BOARDS (>30% repost rate):
#    ProBlogger, Design Observer, Idealist.org
#    High duplication suggests scraping frequency issues.
#    Consider:
#    • Reducing scraping frequency
#    • Improving deduplication logic
#    • Temporarily disabling if >50%
#
# ════════════════════════════════════════════════════════════════════════════════
# ✅ Analysis complete!
```

### 5. `supabase/migrations/006_repost_frequency.sql`
Database views for efficient analytics.

**Views:**
- `board_repost_frequency_stats` - Per-board statistics
- `role_family_repost_frequency_stats` - Per-role-family statistics
- `daily_repost_trends` - Historical daily tracking
- `top_reposted_postings` - Ranked postings per board
- `repost_clusters` - Clustered repost analysis
- `repost_severity_assessment` - Severity levels per board

**Indexes:**
- On `repost_count`, `repost_cluster_id`
- On `event_date` for timeline queries

## Repost Frequency Interpretation

### Health Score Calculation
```
Health Score = 100 - (RepostRate * 2)

Examples:
- 2% repost rate = 100 - 4 = 96/100 (Excellent)
- 10% repost rate = 100 - 20 = 80/100 (Good)
- 25% repost rate = 100 - 50 = 50/100 (Concerning)
- 50% repost rate = 100 - 100 = 0/100 (Critical)
```

### Severity Levels

| Repost Rate | Severity | Meaning |
|-------------|----------|---------|
| < 5% | Excellent | Minimal duplication, excellent data quality |
| 5-15% | Good | Low duplication, acceptable for analysis |
| 15-30% | Moderate | Noticeable duplication, may skew metrics |
| 30-50% | Concerning | Significant duplication issues |
| > 50% | Critical | Severe problems, disable scraper immediately |

### Actions by Severity

**Excellent (< 5%):**
```
✅ Status: Healthy
- Continue current scraping strategy
- Safe for detailed analysis
- Can publish raw data
```

**Good (5-15%):**
```
👍 Status: Acceptable
- Monitor for changes
- Some deduplication may help
- Generally safe for reporting
```

**Moderate (15-30%):**
```
⚠️ Status: Review Required
- Investigate scraping frequency
- May need to deduplicate more aggressively
- Consider reducing collection frequency
```

**Concerning (30-50%):**
```
🚨 Status: Action Required
- Reduce scraping frequency significantly
- Improve match-based deduplication
- Escalate to team for review
```

**Critical (> 50%):**
```
🔴 Status: Disable Scraper
- Temporarily disable collection
- Conduct full audit of scraper
- Do not publish analysis with this data
```

## Advanced Queries

```sql
-- Trend analysis: Weekly repost rate change
SELECT 
  DATE_TRUNC('week', date)::DATE as week,
  jb.name,
  ROUND(AVG(repost_rate_at_date), 1) as weekly_avg_repost_rate,
  LAG(ROUND(AVG(repost_rate_at_date), 1)) OVER (
    PARTITION BY jb.id ORDER BY DATE_TRUNC('week', date)
  ) as prev_week_repost_rate,
  ROUND(AVG(repost_rate_at_date) - LAG(ROUND(AVG(repost_rate_at_date), 1)) OVER (
    PARTITION BY jb.id ORDER BY DATE_TRUNC('week', date)
  ), 1) as trend
FROM daily_repost_trends drt
JOIN job_boards jb ON drt.id = jb.id
GROUP BY week, jb.id, jb.name;

-- Identify chronic reposting patterns
SELECT
  jp.company,
  COUNT(*) as instances,
  COUNT(DISTINCT jp.job_board_id) as boards_posting,
  AVG(jp.repost_count) as avg_reposts,
  MAX(jp.repost_count) as max_reposts
FROM job_postings jp
WHERE jp.repost_count >= 3
GROUP BY jp.company
ORDER BY max_reposts DESC;

-- Data quality by posting age
SELECT
  CASE
    WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - jp.first_seen)) < 7 THEN 'Fresh (0-7d)'
    WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - jp.first_seen)) < 30 THEN 'Recent (8-30d)'
    WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - jp.first_seen)) < 90 THEN 'Established (31-90d)'
    ELSE 'Old (90+d)'
  END as age_category,
  COUNT(*) as posting_count,
  ROUND(AVG(jp.repost_count), 2) as avg_reposts,
  COUNT(CASE WHEN jp.repost_count > 0 THEN 1 END) as reposted_count
FROM job_postings jp
GROUP BY age_category;
```

## Integration with Scoring (Day 11)

Repost frequency becomes primary quality control in scoring:

```typescript
const repostScore = 100 - (boardRepostRate * 2)

// Apply quality discount if data is unreliable
const qualityAdjustment = repostRate < 5 ? 1.0 : 
                          repostRate < 15 ? 0.95 :
                          repostRate < 30 ? 0.85 :
                          repostRate < 50 ? 0.70 : 0.0

// Example:
// Base efficiency score: 65/100
// Repost rate: 35% (concerning)
// Quality adjustment: 0.70
// Final score: 65 * 0.70 = 45.5/100
```

## Files Modified/Created
- ✨ `src/lib/repostFrequency.ts` - Analytics engine (422 lines)
- ✨ `src/pages/api/repostFrequency.ts` - REST API (109 lines)
- ✨ `src/components/RepostFrequencyDisplay.tsx` - React components (345 lines)
- ✨ `scripts/computeRepostFrequency.ts` - Analysis script (121 lines)
- ✨ `supabase/migrations/006_repost_frequency.sql` - DB views & indexes (105 lines)

**Total: 5 new files, 1,102 lines of code**

## Next Step (Day 11)

**Build Scoring Algorithm (V1)**
- Implement weighted formula: 40% lifespan, 30% reposts, 20% employer surveys, 10% candidate surveys
- Add quality adjustment based on repost rate
- Create efficiency_scores table entries
- Build percentile ranking system
- Create score trend tracking
