# Day 17: Board Profile Page

## Overview
Today we build a dynamic, detailed board profile page that presents comprehensive analysis of individual job boards. Users navigate via the Comparison table's "View →" links.

**Key Insight:** The profile page is where hiring leaders dive deep to understand board strengths, weaknesses, and strategic fit for their hiring pipeline.

## Architecture

### API Endpoint
**`src/pages/api/boards/profile.ts`** (125 lines)
- Takes board name (query param) as input
- Returns comprehensive board profile with:
  - Base metrics (score, grade, lifespan, reposts)
  - Top 5 roles with job counts
  - Trend data (direction, % change)
  - Strengths and weaknesses
  - Strategic recommendations
  - Component score breakdown
  - Data quality score
- Includes 4 sample boards (Stack Overflow, LinkedIn, GitHub, Indeed)

### Component: Dynamic Profile Page
**`src/pages/dashboard/profile.tsx`** (380 lines)

#### Data Flow
1. Component reads `board` query param from URL
2. Normalizes board name (spaces → hyphens, lowercase)
3. Fetches or loads mock profile data
4. Renders comprehensive dashboard

#### Page Structure

**1. Header with Board Name**
- Displays selected board name
- Optional: Back to Comparison button

**2. KPI Metrics (4-column grid)**
- Efficiency Score (0-100)
- Average Lifespan (days)
- Data Quality (%)
- Total Jobs (with trend indicator)

**3. Score Breakdown Section**
Shows weighted component scores:
- **40% Lifespan Component** (hiring speed)
  - How quickly positions get filled
  - Scale: 0-40 points
- **30% Repost Quality** (data cleanliness)
  - Low duplicate rate
  - Scale: 0-30 points
- **20% Employer Feedback** (satisfaction)
  - Hiring satisfaction ratings
  - Scale: 0-20 points
- **10% Candidate Visibility** (engagement)
  - Job seeker interest
  - Scale: 0-10 points

Each with progress bar showing points earned/total.

**4. Performance & Top Roles (2-column grid)**

*Left: Performance Metrics*
- Hiring Speed bar (lower = better)
- Data Quality bar
- Overall Score bar with color coding
- Trend indicator (📈 📉 →) with % change

*Right: Top Jobs*
- Ranked list of top 5 roles
- Job count per role
- Relative bar chart

**5. Strengths & Weaknesses (2-column grid)**

*Strengths (✓ green)*
- Examples:
  - Exceptional data quality (97%)
  - Fastest average hiring (12 days)
  - Strong tech talent pool
  - Minimal duplicate postings

*Weaknesses (✕ red)*
- Examples:
  - Premium pricing
  - Tech-only focus
  - Smaller non-tech pool

**6. Strategic Recommendations**
Actionable guidance cards:
- Primary channel for tech roles
- Excellent for senior engineers
- Best ROI for long-term hiring
- Combine with LinkedIn for reach

**7. Comparison Link**
Call-to-action to view comparison table.

## Sample Board Data

### Stack Overflow (A+, 88 score)
**Metrics:**
- Lifespan: 12d (fastest)
- Reposts: 3% (cleanest)
- Jobs: 2,456
- Trend: ↑ 5.2%

**Top Roles:**
1. Software Engineer (1,842)
2. DevOps Engineer (287)
3. ML Engineer (156)
4. Full Stack Developer (123)
5. Backend Engineer (48)

**Strengths:**
- Exceptional data quality (97%)
- Fastest hiring (12 days)
- Strong tech pool
- Minimal dupes

**Weaknesses:**
- Premium pricing
- Tech-only focus
- Smaller non-tech pool

### LinkedIn (A, 85 score)
**Metrics:**
- Lifespan: 14d
- Reposts: 5%
- Jobs: 5,432 (largest)
- Trend: ↑ 3.1%

**Top Roles:**
1. Product Manager (2,145)
2. Software Engineer (1,876)
3. Data Scientist (654)
4. Sales Engineer (432)
5. Manager (325)

**Strengths:**
- Largest talent pool
- All role types
- Professional network
- Employer branding

**Weaknesses:**
- Higher repost rate (5%)
- Slower (14 days)
- Competition is high

### Indeed (B, 72 score)
**Metrics:**
- Lifespan: 18d (slowest)
- Reposts: 12% (highest)
- Jobs: 3,200
- Trend: ↓ -2.3%

**Top Roles:**
1. Software Engineer (1,230)
2. Sales (654)
3. Warehouse (432)
4. Support (345)

**Strengths:**
- Large job pool
- Non-tech roles
- Established platform

**Weaknesses:**
- Data quality (88%)
- Slower hiring
- High dupes (12%)
- Mixed applicant quality

## Dynamic Features

### Query Parameter Mapping
```
/dashboard/profile?board=Stack Overflow
/dashboard/profile?board=LinkedIn
/dashboard/profile?board=GitHub Jobs
/dashboard/profile?board=Indeed
```

Board names are normalized:
- Spaces → hyphens
- Lowercase conversion
- Fallback to first board if not found

### Score Breakdown Visualization
Each component shows:
- Component name and weight %
- What it measures (subtext)
- Points earned / total possible
- Colored progress bar (blue/green/purple/yellow)

### Contextual Coloring
- **Score bar:** Green (80+), Blue (60-79), Red (<60)
- **Strengths:** Green check mark (✓)
- **Weaknesses:** Red X mark (✕)
- **Trend:** 📈 (up), 📉 (down), → (stable)

## User Workflows

### Compare Specific Board
1. From Comparison table, click "View →"
2. See detailed profile of selected board
3. Understand why score is what it is
4. Review hiring characteristics
5. Make strategic investment decisions

### Understand Score Components
1. Look at score breakdown section
2. See which components are strong
3. Identify areas of concern
4. Understand 40/30/20/10 weighting

### Identify Best Boards for Role
1. Review top roles section
2. Find which boards hire for your role
3. Cross-reference with lifespan
4. Check data quality
5. Compare against other boards

## Styling Notes

### Card Layout
- Dark gray background (bg-gray-800)
- Light gray borders (border-gray-700)
- Progress bars with semantic colors
- Left-aligned text with right-aligned metrics

### Typography Hierarchy
- Board name: 2xl bold white (PageHeader)
- Section titles: xl bold white
- Metric labels: sm gray-400
- Values: larger white or colored
- Subtexts: xs gray-500

### Visual Hierarchy
- KPI cards at top (quick assessment)
- Score breakdown next (understanding)
- Details below (deep dive)
- Recommendations bottom (action)

## Files Created/Modified
- ✨ `src/pages/api/boards/profile.ts` - API endpoint (125 lines)
- ✨ `src/pages/dashboard/profile.tsx` - Dynamic profile page (380 lines)

**Total: 1 API + 1 page = 505 lines**

## Next Step (Day 18)

**Enhance Insights Page**
- Market trends (rising/declining roles)
- Board momentum changes
- Role-specific hiring velocity
- Strategic market recommendations
- Charts for trend visualization

Profile page is now the deep-dive tool for understanding individual board performance!
