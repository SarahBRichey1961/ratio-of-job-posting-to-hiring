# Day 16: Comparison Table with Sorting & Filtering

## Overview
Today we enhance the comparison table with fully functional sorting, filtering, and interactive features. The table becomes the primary discovery tool for comparing job boards.

**Key Insight:** A well-designed data table is the most important component of a hiring analytics tool.

## Architecture

### API Endpoint
**`src/pages/api/boards/comparison.ts`** (65 lines)
- Aggregates data from 3 data sources:
  - Efficiency scores (overall_score, grade_letter)
  - Board metrics (lifespan, repost rate, posting count)
  - Trend data (direction, momentum)
- Returns unified ComparisonRow array
- Joins data by board_id
- Calculates derived fields (trend %, data quality)

### Component: Comparison Table
**`src/pages/dashboard/comparison.tsx`** (325 lines)

#### Data Model
```typescript
interface ComparisonRow {
  name: string              // Board name
  score: number             // 0-100 efficiency score
  grade: string             // A+, A, B+, B, C+, C, D, F
  avgLifespan: number       // Days to fill
  repostRate: number        // % duplicates
  totalPostings: number     // Jobs in DB
  topRole: string          // Most common role
  trend: 'up'|'down'|'stable'  // Direction
  trendValue: number        // % change
  dataQuality: number       // 100 - repostRate
}
```

#### Sorting Options
1. **Efficiency Score** (default, desc)
   - Highest scores first
   - Primary hiring quality metric

2. **Avg Lifespan** (asc preferred)
   - Fastest hiring first
   - Lower = better efficiency

3. **Repost Rate** (asc preferred)
   - Cleanest data first
   - Lower = no duplicates

4. **Data Quality** (desc preferred)
   - Most reliable data first
   - Derived from repost rate

5. **Name** (A-Z)
   - Alphabetical sorting
   - For finding specific boards

#### Filtering
- **Minimum Score Slider** (0-100)
  - Dynamic range slider
  - Real-time filtering
  - Shows matching count vs total

#### Visual Indicators
```
Score Bar:
  80+  → Green (✓ High quality)
  60-79 → Blue (◐ Acceptable)
  <60  → Red (✗ Low quality)

Lifespan:
  ≤12d   → Green (Fast)
  13-20d → Yellow (Medium)
  >20d   → Red (Slow)

Repost Rate:
  <10%   → Green (Clean)
  10-20% → Yellow (Fair)
  >20%   → Red (Problematic)

Trend:
  +% → Green 📈 (Improving)
  -% → Red 📉 (Declining)
  →  → Gray → (Stable)
```

## Features

### 1. Real-Time Sorting
- Click column header or select from dropdown
- Toggle ascending/descending with button
- Instant re-sort without page reload
- Icon shows current sort direction

### 2. Score-Based Filtering
- Slider from 0-100
- Filters immediately as user drags
- Shows "X of Y boards" count
- Useful for finding top-tier boards

### 3. Comparison Summary
Below table shows:
- **Highest Score**: Top overall performer
- **Fastest Hiring**: Lowest lifespan
- **Cleanest Data**: Highest data quality
- **Average Score**: Mean across filtered results

### 4. Data Quality Metrics
For each board:
- Efficiency score with visual bar
- Grade badge (A+, A, B, etc)
- Data quality % (100 - repost rate)
- Trend with % change (📈📉→)

### 5. Action Links
- "View Profile →" for each board
- Links to detailed board profile page
- Passes board name as query parameter

## Sample Data

9 high-quality boards:
- **Tier A** (85+): Stack Overflow, LinkedIn, GitHub, HackerNews
- **Tier B** (70-84): We Work Remotely, Indeed, Glassdoor
- **Tier C** (<70): Monster, CraigsList (for demonstration)

Scoring breakdown:
```
Board           Score  Lifespan  Reposts  Quality  Grade  Trend
Stack Overflow    88      12d       3%      97%     A+     ↑ 5.2%
LinkedIn          85      14d       5%      95%     A      ↑ 3.1%
GitHub Jobs       84      13d       4%      96%     A      ↑ 2.8%
HackerNews        82      11d       2%      98%     A      → 0.5%
We Work Remotely  74      16d       8%      92%     B+     ↑ 1.2%
Indeed            72      18d      12%      88%     B      ↓ -2.3%
Glassdoor         68      21d      15%      85%     B      ↓ -1.8%
Monster           52      28d      28%      72%     D      → -0.3%
CraigsList        45      35d      42%      58%     F      ↓ -8.5%
```

## User Workflows

### Find Best Tech Boards
1. Sort by "Efficiency Score" (desc)
2. View top 4 results (Stack, LinkedIn, GitHub, HackerNews)
3. Check trend direction (up = improving, stable = reliable)

### Find Fastest Hiring Boards
1. Sort by "Avg Lifespan" (asc)
2. View boards with 11-14 day lifespan
3. Cross-reference with score (want high score + low lifespan)

### Avoid Problematic Data
1. Filter min score = 70 to remove F/D/C grades
2. View only reliable, vetted boards
3. Can sort by data quality within filtered set

### Compare Trends
1. Sort by trend % change (descending)
2. Find boards improving (green 📈) vs declining (red 📉)
3. Invest in rising boards, exit declining ones

## Component Integration

### Upper Section: Controls
```
[Sort: Efficiency ▼] [Order: ↓ Desc] [Min: 0────50] Showing 9/9 boards
```

### Middle Section: Data Table
```
Job Board │ Efficiency │ Lifespan │ Reposts │ Quality │ Grade │ Trend │ Action
─────────────────────────────────────────────────────────────────────────────
          │   [▓▓▓] 88 │   12d    │   3%    │  97%    │  A+   │ ↑ 5.2%│ View →
```

### Lower Section: Summary Cards
```
[Highest Score: Stack Overflow, 88] [Fastest: HackerNews, 11d]
[Cleanest: HackerNews, 98%]         [Avg Score: 70.1]
```

## Files Modified/Created
- ✨ `src/pages/api/boards/comparison.ts` - New API endpoint (65 lines)
- 🔄 `src/pages/dashboard/comparison.tsx` - Enhanced with sorting/filtering (325 lines)

**Total: 1 new API route + 1 enhanced page = 390 lines**

## Performance Considerations

### Sorting
- Client-side sort with `useMemo` hook
- No re-query needed for different sort orders
- Instant response (<10ms)

### Filtering
- Real-time slider filtering
- Filter applied during sort loop
- Efficient array filter + sort chain

### Data Loading
- Single API call returns all boards
- Caching could be added via React Query
- Could be optimized with pagination for >100 boards

## Design Consistency

### Table Styling
- Alternating row colors for readability
- Gray-700 borders for clear row separation
- Responsive horizontal scroll on mobile
- Fixed header row for sticky reference

### Color Coding
- Score bars match effectiveness (green=good, red=bad)
- Status text colors consistent with bars
- Icon emojis for quick visual scanning
- Trend indicators match market direction

## Next Steps (Day 17)

**Build Board Profile Page Enhancement**
- Make profile dynamic (load selected board data)
- Add role breakdown specific to chosen board
- Add historical trend lines
- Add board-specific recommendations

The comparison table is now the powerful discovery tool for exploring the job board landscape!
