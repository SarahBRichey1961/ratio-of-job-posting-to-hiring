# Job Posting to Hiring Ratio Analyzer

A data analytics platform that tracks job posting lifespans, repost frequency, and hiring efficiency scores across major US job boards.

## Project Structure

```
.
├── src/
│   ├── pages/          # Next.js pages
│   ├── components/     # React components
│   ├── lib/           # Utilities and Supabase client
│   └── styles/        # Global styles
├── supabase/
│   └── migrations/    # Database schema migrations
├── public/            # Static assets
└── package.json       # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Create `.env.local` file (copy from `.env.local.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. Create Database Schema

1. Go to Supabase SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Run the query to create all tables

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the app.

## Database Schema

### Tables

- **job_boards**: Stores job board information (name, URL, category)
- **job_postings**: Individual job postings with lifespan tracking
- **posting_events**: Records when postings appear/reappear/disappear
- **employer_surveys**: Employer feedback on board effectiveness
- **candidate_surveys**: Candidate feedback on board experience
- **efficiency_scores**: Calculated efficiency scores with weighted algorithm

### Schema Scoring Algorithm

```
Overall Score = (Lifespan: 40%) + (Repost: 30%) + (Employer Surveys: 20%) + (Candidate Surveys: 10%)
```

## Next Steps (Day 3+)

- [ ] Day 3: Seed initial job boards
- [ ] Day 4: Build scraper framework
- [ ] Day 5: Normalize job titles
- [ ] Day 6: Track posting lifespans
- [ ] Day 7: Implement repost detection

## Contributing

Follow the 30-day build plan for feature implementation.
