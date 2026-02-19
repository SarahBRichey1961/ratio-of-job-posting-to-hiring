# Day 13: Build Trend Tracking

## Overview
Today we implement comprehensive trend tracking to monitor how efficiency scores change over time. This enables detection of improving/declining boards, seasonal patterns, and anomalies.

**Key Insight:** Historical snapshots are critical for:
- Identifying momentum (boards that have been improving for weeks)
- Early warning (sudden score drops before they become critical)
- Seasonal patterns (hiring cycles, budget cycles)
- Confidence building (can we trust short-term trends?)

## Key Components

### 1. `src/lib/trendTracking.ts`
Trend analysis and anomaly detection engine with 6 main functions.

**Key Functions:**
```typescript
// Create daily snapshot for a board
createSnapshot(boardId, overallScore, lifespan, repostRate, employerScore, candidateScore, postings): Promise<TrendSnapshot>

// Get trend metrics for a board (30-day period)
getBoardTrends(boardId, days?): Promise<TrendMetrics>

// Get trends for all boards
getAllBoardTrends(days?): Promise<TrendMetrics[]>

// Get weekly comparison for a board
getWeeklyComparison(boardId): Promise<WeeklyComparison>

// Detect anomalies using statistical analysis
detectAnomalies(boardId): Promise<AnomalyAlert[]>

// Analyze role-based trend data
getRoleTrends(limit?): Promise<RoleTrend[]>
```

**Data Structures:**

`TrendSnapshot`:
- `id`: number
- `snapshotDate`: date YYYY-MM-DD
- `boardId`: number
- `overallScore`: number (0-100)
- `lifespan`, `repostRate`: current metrics
- `avgEmployerScore`, `avgCandidateScore`: survey scores
- `totalPostings`: job count
- `createdAt`: timestamp

`TrendMetrics`:
- `boardId`, `boardName`: identification
- `currentScore`, `previousScore`: comparison points
- `scoreChange`: raw points difference
- `scoreChangePercent`: percentage change
- `trend`: "up" | "down" | "stable" (±2% threshold)
- `trendStrength`: "strong" | "moderate" | "weak"
  - Strong: >5% change
  - Moderate: 2-5% change
  - Weak: <2% change
- `daysAnalyzed`: period length
- `snapshots`: array of all snapshots in period

`WeeklyComparison`:
- `boardId`, `boardName`: identification
- `thisWeekScore`: average this week
- `lastWeekScore`: average last week
- `weekChange`: week-over-week difference
- `weekTrend`: "up" | "down" | "stable"
- `trendDuration`: weeks of same direction
- `volatility`: std deviation of weekly scores

`AnomalyAlert`:
- `boardId`, `boardName`: which board
- `metric`: which metric (overall_score, avg_lifespan, etc)
- `currentValue`: actual observation
- `expectedValue`: mean of period
- `deviation`: standard deviations from mean
- `severity`: "low" | "medium" | "high"
  - High: >3σ from mean
  - Medium: 2-3σ
  - Low: 1.5-2σ
- `timestamp`: when detected
- `description`: explanation

`RoleTrend`:
- `roleFamily`: string
- `currentScore`: this week
- `weekAgoScore`: last week
- `change`: week-over-week
- `trend`: "up" | "down" | "stable"
- `demandChange`: new postings delta
- `hotness`: percentile rank (0-100)

### 2. `src/pages/api/trends.ts`
REST API endpoints for trend data.

**GET Endpoints:**

`GET /api/trends?action=board&boardId=5`
- Trends for specific board
- Response: `{success, data: TrendMetrics}`

`GET /api/trends?action=all`
- Trends for all boards
- Response: `{success, data: TrendMetrics[]}`

`GET /api/trends?action=weekly&boardId=5`
- Weekly comparison for board
- Response: `{success, data: WeeklyComparison}`

`GET /api/trends?action=anomalies&boardId=5`
- Anomaly alerts for board
- Response: `{success, data: AnomalyAlert[]}`

`GET /api/trends?action=roles`
- Role-based trends
- Response: `{success, data: RoleTrend[]}`

**POST Endpoint:**

`POST /api/trends`
```json
{
  "boardId": 5,
  "overallScore": 78,
  "lifespan": 14,
  "repostRate": 8,
  "employerScore": 75,
  "candidateScore": 82,
  "postings": 156
}
```
- Creates a snapshot
- Response: `{success, data: TrendSnapshot}`

### 3. `src/components/TrendDisplay.tsx`
React components for trend visualization.

**Components:**

`<TrendCard boardName={name} currentScore={78} scoreChange={+5} trend="up" trendStrength="strong" />`
- Summary card showing current score and change
- Color-coded trend indicators

`<TrendChart data={trendMetrics} />`
- 30-day bar chart of scores
- Color: green if improving, red if declining
- Current value highlighted with ring

`<WeeklyComparisonCard data={weeklyComparison} />`
- This week vs last week comparison
- Trend duration and volatility

`<AnomalyAlertCard alert={anomaly} />`
- Single anomaly displayed
- Color by severity (red/orange/yellow)

`<RoleTrendTable data={roleTrends} />`
- All roles with this week's trends
- Demand change, score, hotness rating

`<TrendSummary trends={allTrends} anomalies={anomalies} />`
- High-level market overview
- Most improved board
- Anomaly count

### 4. `scripts/analyzeTrends.ts`
Command-line analysis tool for comprehensive trend insights.

**Output Example:**
```
════════════════════════════════════════════════════════════════════════════════
TREND TRACKING ANALYSIS - HISTORICAL PERFORMANCE & ANOMALY DETECTION
════════════════════════════════════════════════════════════════════════════════

📊 TREND ANALYSIS (30-DAY PERIOD)
────────────────────────────────────────────────────────────────────────────────
Boards with trend data: 28

✅ Improving (↑): 12
   🚀 Stack Overflow                 +8 (+10.3%)
   📈 GitHub Jobs                    +5 (+7.2%)
   📈 LinkedIn                       +3 (+4.1%)
   📈 Indeed                         +2 (+3.3%)
   → HackerNews                      +1 (+1.8%)

❌ Declining (↓): 8
   📉 CraigsList                     -6 (-8.5%)
   📉 Reddit Jobs                    -4 (-5.2%)
   → Dribbble                        -1 (-1.9%)

➡️  Stable (→): 8

📅 WEEKLY COMPARISON
────────────────────────────────────────────────────────────────────────────────
Weekly data for 10 boards:

LinkedIn:
  This Week: 85 | Last Week: 82
  Change: 📈 +3 (Improving)
  Trend Duration: 3 consecutive weeks
  Volatility: 2.1 (measure of score fluctuation)

Stack Overflow:
  This Week: 88 | Last Week: 85
  Change: 📈 +3 (Improving)
  Trend Duration: 4 consecutive weeks
  Volatility: 1.5

Github Jobs:
  This Week: 84 | Last Week: 81
  Change: 📈 +3 (Improving)
  Trend Duration: 2 consecutive weeks
  Volatility: 2.8

Indeed:
  This Week: 72 | Last Week: 70
  Change: 📈 +2 (Improving)
  Trend Duration: 1 consecutive weeks
  Volatility: 3.2

Glassdoor:
  This Week: 68 | Last Week: 68
  Change: → 0 (Stable)
  Trend Duration: 2 consecutive weeks
  Volatility: 1.8

⚠️  ANOMALY DETECTION
────────────────────────────────────────────────────────────────────────────────
Found 3 anomalies:

CraigsList:
  🔴 overall_score: Score dropped significantly (45 vs expected 55)
     Current: 45 | Expected: 55 | Deviation: 2.1σ

Reddit Jobs:
  🟠 avg_lifespan: Average lifespan increased unexpectedly (28d vs expected 18d)
     Current: 28 | Expected: 18 | Deviation: 1.8σ

Dribbble:
  🟡 overall_score: Score slightly elevated (48 vs expected 42)
     Current: 48 | Expected: 42 | Deviation: 1.2σ

🎯 ROLE TRENDS (THIS WEEK)
────────────────────────────────────────────────────────────────────────────────

🚀 Rising Demand (15 roles):
   software-engineer                 +156 new jobs/week | Score: 85
   data-scientist                    +45 new jobs/week | Score: 72
   product-manager                   +32 new jobs/week | Score: 68
   devops-engineer                   +28 new jobs/week | Score: 79
   ml-engineer                       +15 new jobs/week | Score: 71

📉 Declining Demand (8 roles):
   qa-engineer                       -12 jobs/week | Score: 54
   business-analyst                  -8 jobs/week | Score: 58

→ Stable Demand (27 roles)

🔥 Hottest Roles (highest percentile):
   principal-engineer                98th percentile
   staff-engineer                    97th percentile
   senior-software-engineer          95th percentile
   senior-devops-engineer            93rd percentile
   solutions-architect               91st percentile

════════════════════════════════════════════════════════════════════════════════
📊 KEY METRICS
────────────────────────────────────────────────────────────────────────────────

✅ Snapshot accumulation:
   • Total snapshots: 840 (30 snapshots × 28 boards)
   • Boards tracked: 28
   • Suggested frequency: Daily (each board gets 1 snapshot/day)

⚡ Momentum breakdown:
   • Strong uptrend: 5 boards (Stack Overflow, GitHub, LinkedIn, Indeed, HN)
   • Strong downtrend: 3 boards (CraigsList, Reddit, Niche board X)
   • Stable/Weak trends: 20 boards

💡 Trend interpretation:
   • ↑ Up trend: Score increasing over period (positive momentum)
   • ↓ Down trend: Score decreasing over period (negative momentum)
   • → Stable: Score relatively flat (±2% change threshold)
   • Strong trend: >5% change over period
   • Moderate trend: 2-5% change
   • Weak trend: <2% change

════════════════════════════════════════════════════════════════════════════════
✅ Trend analysis complete!
════════════════════════════════════════════════════════════════════════════════
```

### 5. `supabase/migrations/009_trend_tracking.sql`
Database tables and views for trend tracking.

**Tables:**
- `trend_snapshots` - Core table storing daily metric snapshots
  - Unique constraint on (boardId, snapshotDate) for one snapshot per day
  - Indexes on board_date, date for fast queries

**Views:**
- `board_trend_summary` - Current week/month trends with comparisons
- `weekly_board_metrics` - Weekly aggregates including volatility
- `trend_snapshot_latest` - Most recent snapshot per board (materialized)
- `anomaly_candidates` - Data for anomaly detection (30-day rolling stats)
- `board_momentum` - 7-day and 30-day momentum calculations

## Key Concepts

### Trend Detection
```
Simple 3-tier system:
1. Calculate change: percentile_change = (current - previous) / previous * 100
2. Classify trend:
   - If change > 2%: trend = "up"
   - If change < -2%: trend = "down"
   - Otherwise: trend = "stable"
3. Rate strength by magnitude:
   - If |change| > 5%: strength = "strong"
   - If |change| > 2%: strength = "moderate"
   - Otherwise: strength = "weak"
```

### Anomaly Detection (Statistical)
```
Z-score method:
1. Calculate mean and std deviation of 30-day window
2. For latest value, compute z-score: z = (value - mean) / stddev
3. Trigger alert if |z| > 2 (2 std deviations)
4. Severity based on z magnitude:
   - |z| > 3: severity = "high"
   - |z| > 2: severity = "medium"
   - |z| > 1.5: severity = "low"
```

### Weekly Aggregates
```
Snapshots accumulate daily:
- Day 1: LS=70, ID=76, GH=82 (Thu)
- Day 2: LS=71, ID=77, GH=83 (Fri)
- Day 3: LS=72, ID=78, GH=84 (Sat)
- Day 4: LS=70, ID=76, GH=82 (Sun) ← new week
- Day 5: LS=71, ID=77, GH=83 (Mon)

This week average: (71+77+83)/3 = 77
Last week average: (70+76+82)/3 = 76
Week change: +1 point
```

### Trend Duration
Counts consecutive weeks moving in same direction:
- If up trend current week: count how many weeks before this moved up
- Used to distinguish "just started improving" vs "long recovery"
- Example: "3 weeks of consistent improvement" suggests real momentum

## Files Created
- ✨ `src/lib/trendTracking.ts` - Trend analytics (442 lines)
- ✨ `src/pages/api/trends.ts` - REST endpoints (85 lines)
- ✨ `src/components/TrendDisplay.tsx` - React components (318 lines)
- ✨ `scripts/analyzeTrends.ts` - CLI analysis (184 lines)
- ✨ `supabase/migrations/009_trend_tracking.sql` - Database schema (167 lines)

**Total: 5 new files, 1,196 lines of code**

## Dashboard Integration (Day 15+)

Trend features will enable:
1. **Trend Page** - Per-board trend history with charts
2. **Market Momentum** - Which boards are improving/declining
3. **Anomaly Dashboard** - Alerts for unusual activity
4. **Role Heating** - Which roles are emerging/declining
5. **Historical Comparison** - Any date range analysis

## Next Step (Day 14)

**Internal QA**
- Validate all scoring and metric calculations
- Check for data anomalies
- Ensure end-to-end pipeline works
- Fix any bugs before frontend integration
