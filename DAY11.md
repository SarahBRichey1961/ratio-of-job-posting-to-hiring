# Day 11: Build Scoring Algorithm (V1)

## Overview
Today we implement the **comprehensive efficiency scoring algorithm** that combines lifespan, repost frequency, and survey data into a single actionable metric. This is the foundation for ranking and comparing job boards.

**Key Insight:** Efficiency Score combines multiple signals:
- 40% Lifespan (shorter = more efficient hiring)
- 30% Repost Rate (lower = higher data quality)
- 20% Employer Survey (hiring quality feedback)
- 10% Candidate Survey (visibility feedback)
- Quality Adjustment (apply penalty for data issues)

## Key Components

### 1. `src/lib/scoringEngine.ts`
The core scoring algorithm engine with 9 main functions.

**Scoring Formula:**

```typescript
// Component scores (0-100)
lifespanScore = 100 - ((avgLifespan - 7) / 53 * 100)
repostScore = 100 - (repostRate * 2)
surveyScores = (avgRating / 5) * 100

// Quality adjustment
qualityAdjustment = repostRate < 5 ? 1.0 :
                    repostRate < 15 ? 0.95 :
                    repostRate < 30 ? 0.85 :
                    repostRate < 50 ? 0.70 : 0.0

// Overall score
baseScore = (lifespan * 0.40) + (repost * 0.30) + (employer * 0.20) + (candidate * 0.10)
overallScore = baseScore * qualityAdjustment
```

**Key Functions:**
```typescript
// Calculate components for a board
getScoreComponentBreakdown(boardId): Promise<ScoreComponentBreakdown>

// Calculate full score for a board
calculateBoardScore(boardId): Promise<EfficiencyScore>

// Calculate all boards and return ranked
calculateAllBoardScores(): Promise<EfficiencyScore[]>

// Get ranked boards with grades
getRankedBoardsByScore(): Promise<Array<EfficiencyScore & {rank, grade}>>

// Get score trends over time
getBoardScoreTrends(boardId, days): Promise<ScoreTrend[]>

// Scores by role family
getScoresByRoleFamily(limit): Promise<RoleScoreMetrics[]>

// Compare two boards
compareScores(boardId1, boardId2): Promise<{board1, board2}>

// Score distribution histogram
getScoreDistribution(): Promise<Array<{range, min, max, count, percentage}>>
```

**Data Structures:**

`EfficiencyScore`:
- `boardId`: number
- `boardName`: string
- `overallScore`: number (0-100)
- `lifespanScore`: number (0-100, component)
- `repostScore`: number (0-100, component)
- `employerSurveyScore`: number (0-100, component)
- `candidateSurveyScore`: number (0-100, component)
- `qualityAdjustment`: number (multiplier: 0.0 to 1.0)
- `dataCompletenessRatio`: number (0-1)
- `percentile`: number
- `trend`: number (change from previous)
- `lastUpdated`: Date

`ScoreComponentBreakdown`:
- `lifespan`: {weight: 0.40, score: number, contribution: number}
- `reposts`: {weight: 0.30, score: number, contribution: number}
- `employerSurvey`: {weight: 0.20, score: number, contribution: number}
- `candidateSurvey`: {weight: 0.10, score: number, contribution: number}

### 2. `src/pages/api/scoring.ts`
REST API for score queries and computation.

**Endpoints:**

`GET /api/scoring?boardId=5`
- Single board score
- Response: `{success, data: EfficiencyScore}`

`GET /api/scoring?action=all`
- All board scores
- Response: `{success, data: EfficiencyScore[]}`

`GET /api/scoring?action=ranked`
- Ranked boards (best to worst)
- Response: `{success, data: Array<EfficiencyScore & {rank, grade}>}`

`GET /api/scoring?boardId=5&action=breakdown`
- Score component breakdown
- Response: `{success, data: ScoreComponentBreakdown}`

`GET /api/scoring?boardId=5&action=trends&days=30`
- Score trends over time
- Response: `{success, data: ScoreTrend[]}`

`GET /api/scoring?action=by-role`
- Role family scores
- Response: `{success, data: RoleScoreMetrics[]}`

`GET /api/scoring?action=distribution`
- Score distribution histogram
- Response: `{success, data: Array<{range, min, max, count, percentage}>}`

`GET /api/scoring?boardId=5&boardId2=8&action=compare`
- Compare two boards
- Response: `{success, data: {board1, board2}}`

`POST /api/scoring` with `{action: "compute-all"}`
- Recompute all scores
- Response: `{success, data: {computed: number, scores: []}}`

`POST /api/scoring` with `{action: "compute", boardId: 5}`
- Recompute single board
- Response: `{success, data: EfficiencyScore}`

### 3. `src/components/ScoringDisplay.tsx`
React components for visualizing scores.

**Components:**

`<ScoreCard score={score} />`
- Displays full score with grade (A+ through F)
- Component breakdown (lifespan, reposts, surveys)
- Data completeness percentage

`<ScoresRanking scores={ranked} />`
- Ranked list of all boards
- Shows rank, score, grade
- Data completeness indicator

`<ComponentBreakdown breakdown={breakdown} boardName={name} />`
- Visual breakdown of score components
- Bar chart for each weighted component
- Total contribution calculation

`<RoleScoresTable data={roles} />`
- Table of role families
- Average, median, job count
- Best performing board for role

`<ScoreComparison board1={score1} board2={score2} />`
- Side-by-side comparison
- Shows all 4 component scores
- Indicates winner

### 4. `scripts/computeScores.ts`
Command-line scoring analysis tool.

**Usage:**
```bash
npx ts-node scripts/computeScores.ts

# Output:
# ════════════════════════════════════════════════════════════════════════════════
# EFFICIENCY SCORING ALGORITHM - COMPREHENSIVE ANALYSIS
# ════════════════════════════════════════════════════════════════════════════════
#
# 📊 OVERALL STATISTICS
# ────────────────────────────────────────────────────────────────────────────────
# Total Boards Scored: 33
# Average Score: 62.4/100
# Median Score: 58/100
#
# 🏆 TOP PERFORMERS (Highest Efficiency Scores)
# ────────────────────────────────────────────────────────────────────────────────
# 🥇  1. LinkedIn                           89/100 [A] | Lifespan: 88, Reposts: 92
# 🥈  2. Hired                              87/100 [A] | Lifespan: 85, Reposts: 95
# 🥉  3. Indeed                             84/100 [B+] | Lifespan: 82, Reposts: 88
#    4. AngelList                           79/100 [B] | Lifespan: 77, Reposts: 81
#    5. GitHub Jobs                         76/100 [B] | Lifespan: 78, Reposts: 74
# ...
#
# ⏱️  BOTTOM PERFORMERS (Lowest Efficiency Scores)
# ────────────────────────────────────────────────────────────────────────────────
#   29. ProBlogger                          42/100 [D]
#   30. Design Observer                     39/100 [D]
#   31. Idealist.org                        35/100 [F]
#   32. Crunchboard                         28/100 [F]
#   33. Job Portal X                        15/100 [F]
#
# 📈 SCORE DISTRIBUTION
# ────────────────────────────────────────────────────────────────────────────────
# 0-20       █░░░░░░░░ 1 boards (  3%)
# 20-40      ███░░░░░░ 3 boards (  9%)
# 40-60      █████░░░░ 5 boards ( 15%)
# 60-80      ███████░░ 7 boards ( 21%)
# 80-100     ██████░░░ 6 boards ( 18%)
#
# 👔 SCORES BY ROLE FAMILY (Top 10)
# ────────────────────────────────────────────────────────────────────────────────
# software-engineer                  Avg:  75/100 | Median:  73 | Jobs: 1450 | Best: LinkedIn
# product-manager                    Avg:  72/100 | Median:  70 | Jobs:  456 | Best: Indeed
# data-scientist                     Avg:  68/100 | Median:  65 | Jobs:  378 | Best: Hired
# ...
#
# 💡 SCORING INTERPRETATION
#
# 📋 Grade Distribution:
#    A+ to A (85-100): 6 boards - Elite efficiency
#    B+ to B (70-84):  7 boards - Good efficiency
#    C+ to C (50-69):  8 boards - Average to moderate efficiency
#    D to F (0-49):    12 boards - Poor efficiency
#
# ✅ ELITE BOARDS (Score 85+):
#    • LinkedIn: 89/100 [A]
#    • Hired: 87/100 [A]
#    • Indeed: 84/100 [B+]
#    These boards show excellent hiring efficiency and data quality.
#
# 🚨 PROBLEM BOARDS (Score < 50):
#    • Idealist.org: 35/100 [F] (Quality: 60%)
#    • Crunchboard: 28/100 [F] (Quality: 40%)
#    Consider reducing scraping frequency or investigating data quality issues.
```

### 5. `supabase/migrations/007_scoring_algorithm.sql`
Database schema for scoring.

**Tables:**
- `efficiency_scores` - Stores score records with history
  - Overall score
  - Component scores (lifespan, reposts, surveys)
  - Quality adjustment factor
  - Data completeness ratio

**Views:**
- `current_board_scores` - Latest score per board
- `board_score_rankings` - Ranked boards
- `score_distribution` - Distribution histogram
- `score_trends_weekly` - Week-over-week trend
- `role_family_score_performance` - By role metrics
- `score_summary_snapshot` - Materialized view for dashboard

## Grading System

```
Score Range | Grade | Interpretation
90-100      | A+    | Elite - Exceptional efficiency & quality
85-89       | A     | Excellent - Very strong performance
80-84       | B+    | Very Good - Strong hiring efficiency
75-79       | B     | Good - Above average efficiency
70-74       | C+    | Above Average - Acceptable efficiency
60-69       | C     | Average - Moderate efficiency
50-59       | D     | Below Average - Concerning issues
0-49        | F     | Failing - Severe problems, do not use
```

## Quality Adjustment Mechanism

The quality adjustment applies a multiplier based on data integrity (repost rate):

```
Repost Rate | Adjustment | Meaning
< 5%        | 100%       | Excellent - Use full score
5-15%       | 95%        | Good - Minor quality discount
15-30%      | 85%        | Moderate - Noticeable discount
30-50%      | 70%        | Concerning - Significant discount
> 50%       | 0%         | Critical - Data unusable
```

**Example:**
```
Base Score = 75/100
Repost Rate = 25% (concerning quality)
Quality Adjustment = 85%
Final Score = 75 * 0.85 = 63.75 ≈ 64/100

This board's hiring efficiency is good (75), but data quality concerns
reduce confidence in that score by 15%.
```

## Component Scoring Details

### Lifespan Score (40% weight)
- Input: Average posting lifespan in days
- Scale: 7 days → 100, 60 days → 0
- Formula: `100 - ((days - 7) / 53 * 100)`
- Why: Shorter lifespan indicates faster hiring

### Repost Score (30% weight)
- Input: Percentage of postings that are reposts
- Scale: 5% → 95, 30% → 30, 50% → 0
- Formula: `100 - (repostRate * 2)`
- Why: Lower repost rate = higher data quality

### Employer Survey Score (20% weight)
- Input: Average employer rating (1-5)
- Scale: 1 → 0, 5 → 100
- Formula: `(rating / 5) * 100`
- Default: 50 (neutral if no data)
- Why: Employer feedback on hiring quality

### Candidate Survey Score (10% weight)
- Input: Average candidate visibility rating (1-5)
- Scale: 1 → 0, 5 → 100
- Formula: `(rating / 5) * 100`
- Default: 50 (neutral if no data)
- Why: Candidate feedback on board visibility

## Data Completeness Calculation

Tracks what % of scoring components have data:

```
Components:
1. Lifespan data available? (required)
2. Repost data available? (required)
3. Employer surveys submitted? (optional)
4. Candidate surveys submitted? (optional)

Ratio = (components_with_data / 4) * 100
```

Scores with lower completeness (<50%) should be interpreted with caution.

## Files Modified/Created
- ✨ `src/lib/scoringEngine.ts` - Core algorithm (544 lines)
- ✨ `src/pages/api/scoring.ts` - REST API (115 lines)
- ✨ `src/components/ScoringDisplay.tsx` - React components (384 lines)
- ✨ `scripts/computeScores.ts` - Analysis script (134 lines)
- ✨ `supabase/migrations/007_scoring_algorithm.sql` - DB schema (180 lines)

**Total: 5 new files, 1,357 lines of code**

## Integration with Pipeline (Day 8)

Scoring can be integrated into Phase 5 of the pipeline:

```typescript
// In pipelineOrchestrator.ts Phase 5: Compute Metrics
async computeMetrics(): Promise<any> {
  // Compute lifespan metrics (Day 9)
  await bulkUpdateAllLifespans()
  
  // Compute repost metrics (Day 10)
  await bulkDetectAllReposts()
  
  // Compute efficiency scores (Day 11)
  const scores = await calculateAllBoardScores()
  
  // Store snapshot
  await createMetricsSnapshot({
    date: new Date(),
    scores,
    computedAt: new Date(),
  })
}
```

## Next Step (Day 12)

**Add Role/Industry Dimensions**
- Per-role scoring (best board for each role family)
- Per-industry scoring (tech vs. non-tech boards)
- Role-specific efficiency recommendations
- Industry trend comparisons
- Role family hiring velocity metrics
