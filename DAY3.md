# Day 3: Add Job Boards

## Overview

Day 3 involves seeding the database with 30+ major US job boards organized into 4 categories:
- **General**: Indeed, LinkedIn Jobs, ZipRecruiter, Glassdoor, etc. (7 boards)
- **Tech**: Stack Overflow, GitHub Jobs, AngelList, Hired, etc. (9 boards)
- **Remote**: RemoteOK, Remotive, Working Nomads, etc. (5 boards)
- **Niche**: Idealist, ProBlogger, EduJobs, Healthcare Jobsite, etc. (12 boards)

**Total: 33 job boards**

## Files Added/Modified

### New Files
1. **supabase/migrations/002_seed_job_boards.sql** - SQL migration to seed data
2. **src/lib/jobBoards.ts** - Library functions for querying job boards
3. **src/pages/api/jobBoards.ts** - API endpoint for fetching job boards
4. **src/components/JobBoardsDisplay.tsx** - React components to display boards
5. **scripts/seedJobBoards.ts** - Node.js script for seeding via TypeScript

### Modified Files
1. **src/pages/index.tsx** - Updated home page to display all job boards organized by category

## How to Seed the Data

### Option 1: Using Supabase Console (Recommended for first time)

1. Go to your Supabase project dashboard
2. Open the **SQL Editor**
3. Create a new query and paste the contents of `supabase/migrations/002_seed_job_boards.sql`
4. Click **Run**
5. You should see: `SELECT 33` (or the count of successfully inserted boards)

### Option 2: Using the Seed Script

```bash
# Install dependencies first
npm install

# Run the seed script
npx ts-node scripts/seedJobBoards.ts
```

Expected output:
```
🌱 Seeding 33 job boards...
✅ Successfully seeded 33 job boards!

📊 Summary by category:
  general: 7 boards
  tech: 9 boards
  remote: 5 boards
  niche: 12 boards
```

## Testing

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`

3. You should see all job boards organized by category with:
   - Board name
   - Category badge
   - Description
   - Link to visit the job board

4. Check the API endpoint:
   ```bash
   # Get all boards
   curl http://localhost:3000/api/jobBoards

   # Get boards grouped by category
   curl http://localhost:3000/api/jobBoards?grouped=true

   # Get boards by category
   curl http://localhost:3000/api/jobBoards?category=tech
   ```

## Database Verification

Check the seeded data in Supabase SQL Editor:

```sql
-- Count total boards
SELECT COUNT(*) as total FROM job_boards;

-- Count by category
SELECT category, COUNT(*) as count 
FROM job_boards 
GROUP BY category 
ORDER BY count DESC;

-- View all boards
SELECT * FROM job_boards ORDER BY category, name;
```

## Components Used

### JobBoardsGrid
Displays job boards in a responsive grid layout (1 column on mobile, 3 columns on desktop).

### CategoryGroup
Groups boards by category with colored headers and descriptions.

## API Endpoints

### GET /api/jobBoards

**Query Parameters:**
- `category` (optional): Filter by category (general, tech, remote, niche)
- `grouped` (optional): Set to "true" to get results grouped by category

**Example Responses:**

Get all boards:
```json
{
  "success": true,
  "data": [...],
  "total": 33
}
```

Get grouped by category:
```json
{
  "success": true,
  "data": {
    "general": [...],
    "tech": [...],
    "remote": [...],
    "niche": [...]
  },
  "total": 33
}
```

## Next Steps (Day 4)

Day 4 involves building the scraper framework:
- Choose between Python or Node.js for scraping
- Scaffold the scraper template
- Implement logging and error handling
- Test scraping with a sample board (e.g., Indeed)

## Checklist

- [x] Create seed SQL migration
- [x] Create job boards utility library
- [x] Create API endpoint
- [x] Create React components
- [x] Update home page to display boards
- [x] Create TypeScript seed script
- [ ] Run seed script in Supabase
- [ ] Test home page displays all boards
- [ ] Test API endpoints
