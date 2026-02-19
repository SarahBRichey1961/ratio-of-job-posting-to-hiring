
# 30‑Day Build Plan — Plain Markdown Checklist

## Week 1 — Foundation & Data Model (Days 1–7)
- [x] **Day 1 — Project Setup:** Create GitHub repo; folder structure; init Next.js; init Supabase
- [x] **Day 2 — Implement Database Schema:** Add `job_boards`, `job_postings`, `posting_events`, `employer_surveys`, `candidate_surveys`, `efficiency_scores`; test inserts
- [x] **Day 3 — Add Job Boards:** Seed 20–30 U.S. job boards; add categories (general, tech, remote, niche)
- [x] **Day 4 — Build Scraper Framework:** Choose Python/Node; scaffold scraper template; logging + error handling; test scraping (e.g., Indeed)
- [x] **Day 5 — Normalize Job Titles:** Create title→role-family mapping; normalization function; store normalized titles
- [x] **Day 6 — Track Posting Lifespan:** Implement `first_seen`, `last_seen`, `disappeared`; record `posting_events`
- [x] **Day 7 — Repost Detection:** Add repost detection logic; store repost events; validate with sample data

## Week 2 — Data Pipeline & Scoring Engine (Days 8–14)
- [x] **Day 8 — Build Data Pipeline:** Create cron jobs (Supabase/server); schedule daily scrapers; store raw snapshots
- [x] **Day 9 — Compute Posting Lifespan:** Calculate `lifespan = last_seen - first_seen`; persist to `job_postings`
- [ ] **Day 10 — Compute Repost Frequency:** Count repost events per posting; persist to `job_postings`
- [ ] **Day 11 — Build Scoring Algorithm (V1):** Implement weighted formula (40% lifespan, 30% reposts, 20% employer surveys, 10% candidate surveys); store `efficiency_scores`
- [ ] **Day 12 — Add Role/Industry Dimensions:** Score per role family, per industry, per job board
- [ ] **Day 13 — Build Trend Tracking:** Store weekly snapshots; compute week‑over‑week changes
- [ ] **Day 14 — Internal QA:** Validate data; fix anomalies; ensure scoring runs end‑to‑end

## Week 3 — Frontend Dashboard (Days 15–21)
- [ ] **Day 15 — Dashboard Layout:** Create pages — Home, Comparison table, Job board profile, Insights
- [ ] **Day 16 — Comparison Table:** Display job board, efficiency score, lifespan, reposts, best roles; add sorting + filtering
- [ ] **Day 17 — Job Board Profile Page:** Show score, trend chart, strengths, weaknesses, best/worst roles
- [ ] **Day 18 — Insights Page:** Rising job boards, declining job boards, best/worst by role
- [ ] **Day 19 — Add Charts:** Integrate chart library (Recharts/Chart.js); add trend lines + bar charts
- [ ] **Day 20 — Add Auth:** Supabase Auth; email/password login; basic roles (admin/viewer)
- [ ] **Day 21 — Polish UI:** TailwindCSS styling; responsive layout; clean typography

## Week 4 — Surveys, Reports & Launch Prep (Days 22–30)
- [ ] **Day 22 — Employer Survey Form:** Build form with validation; store in `employer_surveys`
- [ ] **Day 23 — Candidate Survey Form:** Build form; store in `candidate_surveys`
- [ ] **Day 24 — Integrate Surveys into Scoring:** Update scoring weights; add survey influence; recompute scores
- [ ] **Day 25 — Weekly Insights Email:** Generate automated report (top/worst boards, trends); send via email API (Resend/SendGrid)
- [ ] **Day 26 — Add Export Features:** CSV export for tables; optional PDF export for insights
- [ ] **Day 27 — Add Onboarding Flow:** Welcome screen; product tour; “How to read the score” guide
- [ ] **Day 28 — QA + Bug Fixes:** Test all flows; fix UI bugs; validate scoring accuracy
- [ ] **Day 29 — Prepare for Pilot Customers:** Create pitch email; landing page; pricing stub
- [ ] **Day 30 — Soft Launch:** Invite 3–5 pilot users; collect feedback; prioritize next steps

---

**Deliverables after 30 days**
- Scrapers for job boards
- Posting lifespan tracking
- Repost detection
- Hiring Efficiency scoring engine
- Dashboard with job board profiles & insights
- Weekly insights emails
- Employer + candidate survey collection
- Pilot-ready MVP