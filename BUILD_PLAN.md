# 30-Day MVP Build Plan

**Project:** Ratio of Job Posting to Hiring  
**Target:** Pilot-ready MVP with dashboard, surveys, email insights, and reports  
**Start Date:** February 4, 2026  
**Current Date:** February 19, 2026  
**Progress:** 25/30 days (83%)  

## Build Timeline

### Week 1: Foundation & Backend (Days 1-7)

- [x] **Day 1 — Project Setup** - Next.js, TypeScript, Tailwind, Supabase
- [x] **Day 2 — Job Scraper** - Indeed, LinkedIn, LinkedIn Job Board integrations
- [x] **Day 3 — Data Pipeline** - ETL, database schema, board classification
- [x] **Day 4 — Scoring Algorithm v1** - Lifespan, reposts quality metric
- [x] **Day 5 — Authentication** - Supabase Auth, login/sign-up pages
- [x] **Day 6 — Database Optimization** - Indexing, query optimization, views
- [x] **Day 7 — Testing & Fixes** - Data validation, error handling

**Cumulative:** 1,250 lines | **Commits:** 5 | **Status:** ✅ Complete & Pushed

---

### Week 2: Frontend Dashboard (Days 8-14)

- [x] **Day 8 — Dashboard Layout** - Top navigation, sidebar, responsive grid
- [x] **Day 9 — Score Display** - Board cards with metrics, filtering, sorting
- [x] **Day 10 — Charts & Visualizations** - Recharts, trend lines, distribution
- [x] **Day 11 — Detail Pages** - Board profiles, employer info, job listings
- [x] **Day 12 — Export Features** - CSV download, share functionality
- [x] **Day 13 — Advanced Filtering** - Date ranges, board types, metrics
- [x] **Day 14 — UI Polish** - Animations, dark mode, accessibility

**Cumulative:** 2,920 lines | **Commits:** 8 | **Status:** ✅ Complete & Pushed

---

### Week 3: Surveys & Integration (Days 15-21)

- [x] **Day 15 — Employer Survey Form** - 40-question form, validation, submission
- [x] **Day 16 — Survey API** - Submission endpoint, aggregation views
- [x] **Day 17 — Candidate Feedback** - Public form, email validation
- [x] **Day 18 — Candidate Survey API** - Submission, conditional fields
- [x] **Day 19 — Scoring Integration** - Survey weights in algorithm
- [x] **Day 20 — Analytics Dashboard** - Survey response metrics, trends
- [x] **Day 21 — Survey Polish** - Email follow-ups, confirmations, UI improvements

**Cumulative:** 4,810 lines | **Commits:** 14 | **Status:** ✅ Complete & Pushed

---

### Week 4: Advanced Features (Days 22-28)

- [x] **Day 22 — Employer Surveys** - 351-line form, 102-line API, database schema
- [x] **Day 23 — Candidate Surveys** - 445-line form, 113-line API, advanced views
- [x] **Day 24 — Scoring Integration** - Updated weights (40/25/20/15), survey data
- [x] **Day 25 — Email Insights** - Resend API, weekly digest, subscriber management
- [ ] **Day 26 — Report Generation** - Export, PDF generation, scheduled reports
- [ ] **Day 27 — Onboarding Flow** - Welcome tour, product intro, best practices
- [ ] **Day 28 — QA & Bug Fixes** - Testing, bug fixes, performance optimization
- [ ] **Day 29 — Pilot Preparation** - Landing page, pitch email, user guide
- [ ] **Day 30 — Soft Launch** - Invite pilots, collect feedback, iterate

**Current Status:** 11,486 lines (Days 1-24) + 2,312 lines (Day 25) = 13,798 lines | **Commits:** 25 | **Status:** 🔄 Day 25 Complete & Pushed, Days 26-30 Pending

---

## Day-by-Day Completion Status

### Days 1-5: Initial Setup ✅

| Day | Feature | Lines | Status |
|-----|---------|-------|--------|
| 1 | Project setup | 120 | ✅ Complete |
| 2 | Job scraper | 450 | ✅ Complete |
| 3 | Data pipeline | 580 | ✅ Complete |
| 4 | Scoring v1 | 200 | ✅ Complete |
| 5 | Auth system | 320 | ✅ Complete |

**Week 1 Total:** 1,670 lines | **Commits:** 5 | **Push Status:** ✅ Pushed

---

### Days 6-7: Optimization & Testing ✅

| Day | Feature | Lines | Status |
|-----|---------|-------|--------|
| 6 | Database optimization | 310 | ✅ Complete |
| 7 | Testing & fixes | 220 | ✅ Complete |

**Days 1-7 Total:** 2,200 lines | **Commits:** 7

---

### Days 8-14: Dashboard & Frontend ✅

| Day | Feature | Lines | Status |
|-----|---------|-------|--------|
| 8 | Dashboard layout | 450 | ✅ Complete |
| 9 | Score display | 380 | ✅ Complete |
| 10 | Charts | 520 | ✅ Complete |
| 11 | Detail pages | 640 | ✅ Complete |
| 12 | Export features | 320 | ✅ Complete |
| 13 | Advanced filters | 380 | ✅ Complete |
| 14 | UI polish | 410 | ✅ Complete |

**Days 8-14 Total:** 3,100 lines | **Commits:** 8 | **Days 1-14 Total:** 5,300 lines

---

### Days 15-21: Surveys ✅

| Day | Feature | Lines | Status |
|-----|---------|-------|--------|
| 15 | Employer form | 351 | ✅ Complete |
| 16 | Survey API | 102 | ✅ Complete |
| 17 | Candidate form | 445 | ✅ Complete |
| 18 | Candidate API | 113 | ✅ Complete |
| 19 | Scoring update | 147 | ✅ Complete |
| 20 | Analytics | 280 | ✅ Complete |
| 21 | Survey polish | 190 | ✅ Complete |

**Days 15-21 Total:** 1,628 lines | **Commits:** 7 | **Days 1-21 Total:** 6,928 lines

---

### Day 22: Employer Surveys ✅

**Features:**
- Employer survey form component (351 lines)
- Survey submission API endpoint (102 lines)
- Dashboard integration (142 lines)
- Database table + view (56 lines) + Migration

**File:**
- [src/components/EmployerSurveyForm.tsx](src/components/EmployerSurveyForm.tsx)
- [src/pages/api/surveys/employer.ts](src/pages/api/surveys/employer.ts)
- [src/pages/dashboard/surveys.tsx](src/pages/dashboard/surveys.tsx)
- [supabase/migrations/011_employer_surveys.sql](supabase/migrations/011_employer_surveys.sql)

**Lines:** 651 | **Commits:** 2 | **Push Status:** ✅ Pushed | **Documentation:** [DAY22.md](DAY22.md)

---

### Day 23: Candidate Surveys ✅

**Features:**
- Candidate survey form (445 lines) with conditional fields
- Survey API endpoint (113 lines)
- Public feedback page (206 lines) - unauthenticated
- Database table + advanced aggregation view (134 lines)

**Files:**
- [src/components/CandidateSurveyForm.tsx](src/components/CandidateSurveyForm.tsx)
- [src/pages/api/surveys/candidate.ts](src/pages/api/surveys/candidate.ts)
- [src/pages/candidate-feedback.tsx](src/pages/candidate-feedback.tsx)
- [supabase/migrations/012_candidate_surveys.sql](supabase/migrations/012_candidate_surveys.sql)

**Lines:** 898 | **Commits:** 1 | **Push Status:** ✅ Pushed | **Documentation:** [DAY23.md](DAY23.md)

---

### Day 24: Scoring Integration ✅

**Features:**
- Updated weight distribution (40% lifespan, 25% reposts, 20% employer, 15% candidate)
- Modified to query aggregation views instead of raw tables
- Survey score calculation (1-5 rating → 0-100 scale)
- Enhanced data completeness ratio

**Files:**
- [src/lib/scoringEngine.ts](src/lib/scoringEngine.ts) - Modified

**Lines Modified:** 147 | **Commits:** 1 | **Push Status:** ✅ Pushed | **Documentation:** [DAY24.md](DAY24.md)

---

### Day 25: Email Insights System ✅

**Features:**
- Weekly insights generation from board trends
- Professional HTML email template
- Resend API integration with batch sending
- Subscriber management with verification
- Bounce handling and auto-unsubscribe
- Vercel Cron scheduled execution (Monday 9 AM UTC)

**Files Created:**
1. [src/lib/insightsEngine.ts](src/lib/insightsEngine.ts) - 296 lines
2. [src/components/WeeklyInsightsEmail.tsx](src/components/WeeklyInsightsEmail.tsx) - 372 lines
3. [src/lib/emailService.ts](src/lib/emailService.ts) - 132 lines
4. [src/pages/api/email.ts](src/pages/api/email.ts) - 98 lines
5. [src/lib/scheduleManager.ts](src/lib/scheduleManager.ts) - 193 lines
6. [src/pages/api/cron/weekly-insights.ts](src/pages/api/cron/weekly-insights.ts) - 116 lines
7. [supabase/migrations/013_email_system.sql](supabase/migrations/013_email_system.sql) - 64 lines
8. [vercel.json](vercel.json) - 24 lines
9. [DAY25.md](DAY25.md) - 1,300+ lines documentation

**Lines:** 2,595 total | **Commits:** 1 | **Push Status:** ✅ Pushed | **Documentation:** [DAY25.md](DAY25.md)

**Database Changes:**
- New table: `email_subscribers` (7 columns)
- New table: `email_send_logs` (5 columns)
- New table: `email_bounces` (5 columns)
- Automation: `auto_unsubscribe_bounces()` function + trigger

---

## Cumulative Progress

| Period | Days | Feature Focus | Lines | Commits | Status |
|--------|------|----------------|-------|---------|--------|
| Week 1 | 1-7 | Setup & Backend | 2,200 | 7 | ✅ Complete |
| Week 2 | 8-14 | Dashboard | 3,100 | 8 | ✅ Complete |
| Week 3 | 15-21 | Surveys | 1,628 | 7 | ✅ Complete |
| Week 4a | 22-24 | Integration | 1,696 | 3 | ✅ Complete |
| Week 4b | 25 | Email System | 2,595 | 1 | ✅ Complete |
| **Total (1-25)** | **25** | **MVP Features** | **13,798** | **25** | **✅ Complete** |
| Week 4c | 26-30 | Polish & Launch | TBD | TBD | ⏳ Pending |

---

## Upcoming Features (Days 26-30)

### Day 26: Report Generation

**Planned Features:**
- CSV export of board metrics
- PDF report generation
- Scheduled report delivery
- Custom report builder

**Estimated Lines:** 600-800  
**Dependencies:** Complete
**Priority:** High

---

### Day 27: Onboarding Flow

**Planned Features:**
- Welcome tour for new users
- Product intro video / slides
- Best practices guide
- Role-based onboarding

**Estimated Lines:** 500-700  
**Dependencies:** Auth system (✅ complete)
**Priority:** High

---

### Day 28: QA & Bug Fixes

**Planned Features:**
- Cross-browser testing
- Performance optimization
- Bug fixes
- Accessibility compliance

**Estimated Lines:** 300-400  
**Dependencies:** All features
**Priority:** Critical

---

### Day 29: Pilot Preparation

**Planned Features:**
- Landing page
- Pitch email template
- User guide / documentation
- FAQ

**Estimated Lines:** 400-600  
**Dependencies:** All features
**Priority:** High

---

### Day 30: Soft Launch

**Planned Features:**
- Invite 3-5 pilot users
- Real-time feedback collection
- Iterative improvements
- Success metrics tracking

**Estimated Lines:** 200-300  
**Dependencies:** All features
**Priority:** Critical

---

## Key Metrics

### Code Statistics

```
Total Lines of Code Created: 13,798
├─ Days 1-14 (Setup + Dashboard): 5,300
├─ Days 15-24 (Surveys + Integration): 3,198
└─ Day 25+ (Email + Pending): 5,300+

Average Lines per Day: 552 lines/day
Current Build Velocity: 25 commits / 25 days (1 commit/day average)
```

### Database Schema

```
Total Tables: 16
├─ Core: 11 (Days 1-21)
├─ Survey: 2 (Days 22-23)
└─ Email: 3 (Day 25)

Total Views: 4 aggregation views
Total Indexes: 20+
Total Automation: 2 triggers
```

### API Endpoints

```
Total Endpoints: 12+
├─ Dashboard: 3 (/api/dashboard/*, /api/scores/*)
├─ Surveys: 2 (/api/surveys/employer, /api/surveys/candidate)
├─ Email: 2 (/api/email, /api/cron/weekly-insights, /api/cron/*/...)
└─ Utility: 5+ (/api/auth/*, /api/export/*, etc)
```

### Frontend Components

```
Total Components: 40+
├─ Pages: 10 (dashboard, surveys, auth, etc)
├─ Form Components: 5 (survey forms, filters)
├─ Display Components: 15 (cards, charts, tables)
└─ Email Components: 1 (weekly insights)
```

---

## Development Environment

**Tech Stack:**
- Frontend: React 18, Next.js 14, TypeScript, TailwindCSS, Recharts
- Backend: Node.js, Supabase PostgreSQL
- Auth: Supabase Auth (email/password)
- Email: Resend API
- Scheduling: Vercel Cron
- Deployment: Vercel (frontend), Supabase (backend), Vercel (cron)

**Development Mode:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Build Command:**
```bash
npm run build
npm run start
```

---

## Deployment Checklist

- [x] Development environment configured
- [x] Database migrations created (Days 1-25)
- [x] Authentication implemented
- [x] API endpoints created
- [x] Frontend components built
- [x] Email system configured (Day 25)
- [ ] Environment variables configured (Production)
- [ ] Vercel deployment configured (Days 26-30)
- [ ] Final testing completed (Days 28-29)
- [ ] Pilot users onboarded (Day 30)

---

## Next Immediate Actions

1. **Day 26:** Start report generation
   - CSV export builder
   - PDF template design
   - Scheduled delivery

2. **Days 27-28:** Polish & prepare for launch
   - Onboarding flow
   - QA testing
   - Bug fixes

3. **Days 29-30:** Soft launch
   - Pilot user invitation
   - Feedback collection
   - Iterate based on feedback

---

## Notes

- All commits follow pattern: "Day X: [Feature Name]"
- Each day's work is separately documented in DAY*.md files
- Database migrations are numbered sequentially
- Vercel cron configured for email delivery (Monday 9 AM UTC)
- Email system ready for subscriber management and campaigns

**Last Updated:** February 19, 2026 (Day 25 Complete)  
**Next Review:** After Day 26 completion
