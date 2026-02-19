# Day 12: Add Role/Industry Dimensions

## Overview
Today we extend the scoring system to analyze efficiency **by role family and industry**. This enables sector-specific insights and role-specific hiring recommendations, moving from board-level to market-level analysis.

**Key Insight:** Different roles and industries have different hiring patterns:
- Tech roles may have different efficiency profiles than general roles
- Remote-focused boards may excel for certain roles
- Role demand varies dramatically across industries

## Key Components

### 1. `src/lib/dimensionalScoring.ts`
Role and industry analysis engine with 5 main functions.

**Key Functions:**
```typescript
// All role family scores
getRoleScores(): Promise<RoleScore[]>

// All industry scores
getIndustryScores(): Promise<IndustryScore[]>

// Best boards for specific role
getBestBoardsForRole(roleFamily): Promise<RolePerBoardScore[]>

// Hiring velocity by role
getRoleHiringVelocity(): Promise<Array<{roleFamily, jobCount, newJobsPerDay, ...}>>

// Role-specific recommendations
getRoleRecommendations(): Promise<RoleRecommendation[]>
```

**Data Structures:**

`RoleScore`:
- `roleFamily`: string
- `boards`: number (count offering this role)
- `avgScore`: number
- `medianScore`: number
- `minScore`: number
- `maxScore`: number
- `jobCount`: number
- `bestBoard`: {id, name, score}
- `worstBoard`: {id, name, score}
- `trend`: number

`IndustryScore`:
- `industry`: string (Tech, Remote, General, Niche)
- `description`: string
- `boardCount`: number
- `avgScore`: number
- `boards`: Array<{id, name, score}>
- `jobCount`: number
- `topRole`: string
- `jobsByRole`: Record<string, number>

`RolePerBoardScore`:
- `boardId`: number
- `boardName`: string
- `roleFamily`: string
- `jobCount`: number
- `avgLifespan`: number
- `avgRepostRate`: number
- `score`: number
- `grade`: string

### 2. `src/pages/api/dimensionalScoring.ts`
REST API for dimensional analysis.

**Endpoints:**

`GET /api/dimensionalScoring?action=roles`
- All role family scores
- Response: `{success, data: RoleScore[]}`

`GET /api/dimensionalScoring?action=industries`
- All industry scores
- Response: `{success, data: IndustryScore[]}`

`GET /api/dimensionalScoring?role=software-engineer&action=role-details`
- Best boards for specific role
- Response: `{success, data: RolePerBoardScore[]}`

`GET /api/dimensionalScoring?action=velocity`
- Hiring velocity by role family
- Response: `{success, data: Array<{roleFamily, jobCount, newJobsPerDay, ...}>}`

`GET /api/dimensionalScoring?action=recommendations`
- Role-specific recommendations
- Response: `{success, data: RoleRecommendation[]}`

### 3. `src/components/DimensionalScoringDisplay.tsx`
React components for dimensional analysis.

**Components:**

`<RoleScoresTable data={roles} />`
- Table of all roles with scores
- Shows best/worst boards
- Job count and board diversity

`<IndustryScoresCards industries={industries} />`
- 4 cards for Tech, Remote, General, Niche
- Avg score, board count, top role
- Top 3 boards in each category

`<RoleDetailsTable role={role} boards={boards} />`
- Best boards for specific role
- Shows lifespan and repost rate
- Specific to individual role

`<HiringDemandChart data={velocity} />`
- 3-column grid: High/Medium/Low demand
- Shows roles in each category
- New jobs per day metric

`<RecommendationCard role={role} avgScore={score} recommendation={text} />`
- Individual recommendation card
- Color-coded by score level
- Actionable advice

### 4. `scripts/analyzeDimensionalScores.ts`
Command-line analysis tool for dimensional insights.

**Usage:**
```bash
npx ts-node scripts/analyzeDimensionalScores.ts

# Output:
# ════════════════════════════════════════════════════════════════════════════════
# DIMENSIONAL SCORING ANALYSIS - ROLE & INDUSTRY BREAKDOWN
# ════════════════════════════════════════════════════════════════════════════════
#
# 👔 ROLE FAMILY ANALYSIS
# ────────────────────────────────────────────────────────────────────────────────
# Total Role Families: 156
#
# Top 10 Roles by Average Score:
# 🥇  1. principal-engineer              Avg: 78 | Jobs:   245 | Boards: 28
# 🥈  2. staff-engineer                  Avg: 76 | Jobs:   189 | Boards: 26
# 🥉  3. devops-engineer                 Avg: 75 | Jobs:   423 | Boards: 31
#    4. ml-engineer                      Avg: 73 | Jobs:   156 | Boards: 24
#    5. senior-software-engineer         Avg: 72 | Jobs:   687 | Boards: 32
# ...
#
# Bottom 5 Roles by Average Score:
#     rare-skill-xyz                     Avg: 25 | Jobs:      3 | Boards: 2
#     niche-role-abc                     Avg: 22 | Jobs:      5 | Boards: 1
#
# 🏭 INDUSTRY ANALYSIS
# ────────────────────────────────────────────────────────────────────────────────
#
# Tech (Technology and developer-focused job boards)
#   Avg Score: 78/100
#   Boards: 12
#   Jobs: 8,456
#   Top Role: software-engineer
#   Top Boards:
#     • Stack Overflow: 88
#     • GitHub Jobs: 85
#     • HackerNews: 82
#
# Remote (Remote-first and distributed work boards)
#   Avg Score: 71/100
#   Boards: 5
#   Jobs: 2,134
#   Top Role: remote-developer
#   Top Boards:
#     • We Work Remotely: 84
#     • Remote OK: 79
#     • FlexJobs: 73
#
# General (General purpose job boards)
#   Avg Score: 65/100
#   Boards: 10
#   Jobs: 5,234
#   Top Role: software-engineer
#   Top Boards:
#     • LinkedIn: 89
#     • Indeed: 84
#     • Glassdoor: 76
#
# Niche (Specialized and niche job boards)
#   Avg Score: 42/100
#   Boards: 6
#   Jobs: 1,234
#   Top Role: designer
#   Top Boards:
#     • Dribbble: 68
#     • Designer Hangout: 45
#     • AngelList: 42
#
# ⚡ HIRING VELOCITY & DEMAND
# ────────────────────────────────────────────────────────────────────────────────
#
# High Demand Roles (48):
#   • software-engineer: 3,245 jobs, 108.2/day
#   • product-manager: 456 jobs, 15.2/day
#   • data-scientist: 378 jobs, 12.6/day
#   • senior-engineer: 234 jobs, 7.8/day
#   • full-stack-engineer: 189 jobs, 6.3/day
#
# Medium Demand Roles (62):
#   • qa-engineer: 123 jobs, 4.1/day
#   • business-analyst: 98 jobs, 3.3/day
#   ...
#
# 💡 ROLE-SPECIFIC RECOMMENDATIONS
# ────────────────────────────────────────────────────────────────────────────────
#
# software-engineer:
#   Avg Score: 78/100
#   Recommendation: software-engineer has high demand and good quality on hiring boards. All top boards are reliable for this role.
#
# product-manager:
#   Avg Score: 66/100
#   Recommendation: product-manager is moderately well served. Focus on the top 3 boards for best hiring outcomes.
#
# data-scientist:
#   Avg Score: 52/100
#   Recommendation: data-scientist shows lower efficiency. Consider diversifying across boards and investigating data quality.
#
# 📊 KEY INSIGHTS
# ────────────────────────────────────────────────────────────────────────────────
#
# ✅ Role-based insights:
#    • Average role score across all families: 62
#    • Best role: principal-engineer (78, 245 jobs)
#    • Most challenging role: niche-role-abc (22, 5 jobs)
#
# 🏭 Industry-based insights:
#    • Average industry score: 64
#    • Best performing industry: Tech (78)
#    • Total industries tracked: 4
#
# 📈 Market dynamics:
#    • Total jobs listed: 17,058
#    • Average jobs per role: 109
#    • High demand roles: 48
#    • Market concentration: Top 10 roles account for 68% of jobs
```

### 5. `supabase/migrations/008_dimensional_scoring.sql`
Database views for role and industry analysis.

**Views:**
- `role_family_scoring` - All role metrics
- `role_competitive_landscape` - Which boards have what roles
- `board_industry_classification` - Board categorization
- `industry_efficiency_summary` - Industry-level aggregates
- `role_hiring_velocity` - Daily hiring pace by role
- `role_demand_classification` - High/Medium/Low demand classification

## Industry Categories

**Tech** (8-12 boards)
- Stack Overflow, GitHub Jobs, HackerNews, Dribbble, CSS-tricks
- Avg score typically highest (75-85)
- High concentration of developer roles

**Remote** (4-6 boards)
- We Work Remotely, Remote OK, FlexJobs, WeWorkFromHere
- Specialized in fully-remote positions
- Often higher lifespan (candidates take longer to apply remotely)

**General** (8-12 boards)
- LinkedIn, Indeed, Glassdoor, Hired, AngelList
- Broadest role coverage
- Mixed quality, high volume

**Niche** (4-8 boards)
- Idealist, CraigsList, Designer Hangout, BetaList
- Specialized by function or type
- Lower volume, domain-expertise required

## Role Demand Classification

```
High Demand (> 200 postings):
- Software engineer (typically 2,000-5,000 postings)
- Product manager (300-800 postings)
- Data scientist (200-500 postings)

Medium Demand (50-200 postings):
- QA engineer
- Business analyst
- DevOps engineer

Low Demand (< 50 postings):
- Niche roles (blockchain engineer, game developer)
- Specialized roles (marine biologist, archaeologist)
```

## Competitive Landscape Analysis

For each role family, we analyze:
1. **Which boards have the most postings** → indicates market fit
2. **Average lifespan by board** → hiring speed for this role
3. **Repost rate** → data quality for role-specific data
4. **Board efficiency score** → overall quality for this role

**Example:**
```
Software Engineer - Most competitive across all boards
- Best on LinkedIn (score: 89, 450 jobs)
- Fast hiring on Stack Overflow (avg: 12d, score: 88)
- High quality data on GitHub Jobs (2% repost, score: 85)
- Lower efficiency on niche boards (score: 45-55)

→ Recommendation: Post on LinkedIn, Stack Overflow, or GitHub Jobs
```

## Files Modified/Created
- ✨ `src/lib/dimensionalScoring.ts` - Role/industry analytics (420 lines)
- ✨ `src/pages/api/dimensionalScoring.ts` - REST API (66 lines)
- ✨ `src/components/DimensionalScoringDisplay.tsx` - React components (296 lines)
- ✨ `scripts/analyzeDimensionalScores.ts` - Analysis script (154 lines)
- ✨ `supabase/migrations/008_dimensional_scoring.sql` - DB views (120 lines)

**Total: 5 new files, 1,056 lines of code**

## Integration with Dashboard (Day 15+)

Dimensional scores will power:
1. **Role-specific hiring profiles** - "Best boards for product managers"
2. **Industry comparisons** - "Tech vs. Remote hiring trends"
3. **Market demand insights** - "Which roles are hot right now?"
4. **Competitive analysis** - "Where are your competitors posting?"

## Next Step (Day 13)

**Build Trend Tracking**
- Weekly snapshots of all metrics
- Week-over-week change calculation
- Trend direction indicators (↑ ↓ →)
- Historical performance tracking
- Anomaly detection for sudden changes
