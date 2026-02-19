# Day 15: Dashboard Layout

## Overview
Today we build the complete dashboard structure with:
- Main layout with responsive sidebar navigation
- 5 dashboard pages (Home, Comparison, Profile, Insights, QA)
- Reusable UI component library
- Dark theme (gray-900 background)
- Professional dashboard interface

**Key Insight:** Building a solid layout foundation makes adding pages fast and consistent.

## Architecture

### Core Layout Component
**`src/components/DashboardLayout.tsx`** (280 lines)
- Sidebar navigation with collapsible toggle
- Top header with page title and date
- Navigation items with icons and descriptions
- Responsive design that works on mobile with collapsed sidebar

### UI Component Library
**`src/components/DashboardUI.tsx`** (320 lines)
Reusable components:
- `PageHeader` - Page title and description
- `MetricCard` - KPI display with trends
- `StatsSection` - Grid layout for metrics
- `Card` - Generic content container
- `Section` - Content section with title
- `FilterBar` - Filter controls
- `Button` - Styled button variants
- `Input/Select` - Form components

### Dashboard Pages

**`src/pages/dashboard/index.tsx`** (Home)
- Overview with key metrics
- Market overview with top boards and hot roles
- System status
- Recent changes summary

**`src/pages/dashboard/comparison.tsx`** (Comparison)
- Filterable/sortable board comparison table
- Side-by-side efficiency metrics
- Grade badges (A+, A, B, etc)
- Summary statistics

**`src/pages/dashboard/profile.tsx`** (Board Profile)
- Single board detailed view
- Performance metrics with progress bars
- Top roles for this board
- Score component breakdown
- Trend indicator

**`src/pages/dashboard/insights.tsx`** (Insights)
- Market trends (rising/declining roles)
- Industry performance comparison
- Strategic recommendations
- Competitive positioning

**`src/pages/dashboard/qa.tsx`** (QA Status)
- System health overview
- Component status cards
- Data quality metrics
- Validation results from QA system

## Color Palette
```
Background:   bg-gray-900 (dark)
Secondary:    bg-gray-800 (cards)
Borders:      border-gray-700
Text:         text-white (primary), text-gray-400 (secondary)
Accents:      
  - blue-600 (primary actions)
  - green-400/green-500 (success)
  - red-400/red-500 (danger)
  - yellow-600 (warnings)
  - purple-600 (emphasis)
```

## Navigation Structure
```
DashboardLayout
├── Sidebar (collapsible)
│   ├── Logo
│   ├── Toggle button
│   ├── Nav items
│   │   ├── Home
│   │   ├── Comparison
│   │   ├── Board Profile
│   │   ├── Insights
│   │   └── QA Status
│   └── Footer
├── Main (flex-1)
│   ├── Header
│   │   ├── Page title
│   │   ├── Current date
│   │   └── User menu
│   └── Content area
```

## Pages Overview

### Home Dashboard
Key sections:
- 4 metric cards (boards, avg efficiency, total postings, unique roles)
- Market overview with top performers
- Recent changes and anomalies
- Industry breakdown chart

### Comparison Table
Features:
- Sort by score, lifespan, reposts, name
- Filter by industry category
- Visual score bars
- Grade indicators
- Quick "View Profile" links
- Summary statistics

### Board Profile
Shows for a single board:
- Overview metrics (score, lifespan, repost rate, job count)
- Performance metrics with bars
- Top 3 roles
- Trend indicator
- Score component breakdown (40/30/20/10 weights)

### Insights Page
Strategic analysis:
- Rising/declining role trends
- Industry performance comparison
- Board positioning matrix
- Recommendations for different personas
  - Job seekers
  - Recruiters
  - Product teams

### QA Status
System monitoring:
- Overall health status bar
- 6 component status cards
- Data quality metrics (92.1%, 96.8%, 100%)
- Validation results (pass/fail/warnings)

## Component Examples

### Metric Card
```typescript
<MetricCard
  label="Efficiency Score"
  value={88}
  subtitle="Grade: A+"
  trend="up"
  trendValue="+5.2%"
  icon="⭐"
/>
```

### Data Table Example
```
| Job Board      | Efficiency Score | Avg Lifespan | Repost Rate | Grade | Action      |
|----------------|------------------|--------------|-------------|-------|-------------|
| Stack Overflow |        88 [▓▓▓]  |     12d      |      3%     |  A+   | View →      |
| LinkedIn       |        85 [▓▓▓]  |     14d      |      5%     |  A    | View →      |
| GitHub Jobs    |        84 [▓▓▓]  |     13d      |      4%     |  A    | View →      |
```

## Files Created
- ✨ `src/components/DashboardLayout.tsx` - Main layout (280 lines)
- ✨ `src/components/DashboardUI.tsx` - UI components (320 lines)
- ✨ `src/pages/dashboard/index.tsx` - Home page (200 lines)
- ✨ `src/pages/dashboard/comparison.tsx` - Comparison page (190 lines)
- ✨ `src/pages/dashboard/profile.tsx` - Profile page (230 lines)
- ✨ `src/pages/dashboard/insights.tsx` - Insights page (200 lines)
- ✨ `src/pages/dashboard/qa.tsx` - QA page (150 lines)

**Total: 7 new files, 1,570 lines of code**

## Design Notes

### Dark Theme
- Easier on eyes for long sessions
- Modern professional look
- Good contrast ratios for accessibility
- Allows accent colors to pop

### Responsive Design
- Grid-based layouts
- Mobile-friendly navigation (collapsed sidebar)
- Adaptive column counts (1 col mobile, 2-4 cols desktop)
- Touch-friendly button sizes

### Data Visualization
- Progress bars for metrics
- Color coding for performance levels
- Icons for quick scanning
- Trend indicators (📈 📉 →)

## Next Step (Day 16)

**Add Charts and Data Visualization**
- Integrate Recharts library
- Add trend line charts
- Add bar charts for comparisons
- Add pie charts for industry breakdown
- Make data interactive (hover tooltips, etc)

The dashboard structure is now in place, ready to wire up real data!
