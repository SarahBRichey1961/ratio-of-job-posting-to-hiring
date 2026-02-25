# Hub Feature Implementation Guide

## Quick Setup

### 1. Database Setup

Run the migration to create all hub tables:

```bash
# Use Supabase CLI
supabase db push supabase/migrations/create_hub_tables.sql

# Or manually in Supabase SQL editor
# Copy the contents of: supabase/migrations/create_hub_tables.sql
# Paste into Supabase SQL editor and run
```

This will:
- Create all hub tables (members, projects, discussions, opportunities, etc.)
- Set up Row Level Security policies
- Create performance indexes
- Enable necessary RLS protections

### 2. Environment Setup

No additional environment variables needed beyond existing Supabase setup.

### 3. Navigation Integration

To add Hub links to your main navigation, add these links:

```tsx
// In your navigation component
<Link href="/hub">
  <a>Hub</a>
</Link>
```

## Implementation Details

### Database Tables Created

1. **hub_members** - User profiles and skills
2. **hub_projects** - AI projects with team members
3. **hub_discussions** - Community discussions
4. **hub_discussion_comments** - Comments on discussions
5. **hub_learning_resources** - Learning materials (ready for future content)
6. **hub_user_achievements** - User badges and achievements
7. **hub_opportunities** - Job opportunities, freelance gigs, mentorships
8. **hub_opportunity_applications** - Applications to opportunities

### API Routes Created

```
/api/hub/members.ts          - Member profile management
/api/hub/projects.ts         - Project CRUD operations
/api/hub/discussions.ts      - Discussion creation and listing
/api/hub/opportunities.ts    - Opportunity management
```

### Pages & Routes Created

```
/hub/                                    - Hub home page
/hub/projects/                           - Browse projects
/hub/projects/new                        - Create new project
/hub/projects/[id]                       - View project (ready for implementation)
/hub/discussions/                        - Browse discussions
/hub/discussions/new                     - Create new discussion
/hub/discussions/[id]                    - View discussion (ready for implementation)
/hub/opportunities/                      - Browse opportunities
/hub/opportunities/new                   - Post opportunity
/hub/opportunities/[id]                  - View opportunity (ready for implementation)
```

## Key Features Implemented

### ✅ Complete

- [x] Database schema with 9 tables
- [x] Row Level Security (RLS) policies
- [x] API endpoints for CRUD operations
- [x] Hub home page with feature overview
- [x] Projects page with filtering and creation
- [x] Discussions page with type/category filtering
- [x] Opportunities page with type filtering
- [x] Forms for creating projects, discussions, and opportunities
- [x] User experience for unemployed/job seekers
- [x] Learning goals and technology tracking
- [x] Skill requirements tracking for opportunities

### ⏳ Ready for Additional Development

- [ ] Individual project/discussion/opportunity detail pages
- [ ] Project team collaboration features
- [ ] Discussion voting and marking solutions
- [ ] Opportunity application workflow
- [ ] User achievement system
- [ ] Direct messaging between members
- [ ] Project milestone tracking
- [ ] Skill verification system
- [ ] Member profiles with portfolio display
- [ ] Admin moderation tools

## Usage Examples

### Create a Project

```typescript
const response = await axios.post('/api/hub/projects', {
  title: 'AI Resume Parser',
  description: 'Build an AI system to parse resumes',
  problem_statement: 'Companies need automated resume processing',
  category: 'nlp',
  difficulty_level: 'intermediate',
  creator_id: userId,
  learning_goals: ['NLP', 'Resume Processing', 'Python'],
  technologies_used: ['Python', 'spaCy', 'FastAPI'],
  start_date: new Date().toISOString(),
  target_completion_date: '2026-04-01',
})
```

### Search Opportunities

```typescript
const response = await axios.get('/api/hub/opportunities', {
  params: {
    opportunity_type: 'job',
    is_ai_focused: true,
    search: 'machine learning',
    limit: 20,
  },
})
```

### Create a Discussion

```typescript
const response = await axios.post('/api/hub/discussions', {
  title: 'Help with TensorFlow installation',
  description: 'I\'m having trouble installing TensorFlow on Windows...',
  type: 'question',
  category: 'learning',
  creator_id: userId,
  tags: ['tensorflow', 'python', 'setup'],
  ai_related: true,
})
```

## Authentication Requirements

The API endpoints expect user authentication. Update the following to use your actual auth system:

```typescript
// In each API endpoint, replace:
creator_id: 'user-id-here'

// With your actual auth system, e.g.:
const session = await getSession() // GetServerSideProps
const creator_id = session.user.id
```

Use getServerSideProps in pages to pass authenticated user info:

```typescript
export const getServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session) {
    return { redirect: { destination: '/login' } }
  }
  return { props: { userId: session.user.id } }
}
```

## Testing the Feature

### 1. Test Database Access
```sql
-- In Supabase SQL editor
SELECT COUNT(*) FROM hub_members;
SELECT COUNT(*) FROM hub_projects;
```

### 2. Test API Endpoints
```bash
# Get projects
curl http://localhost:3000/api/hub/projects

# Get discussions
curl http://localhost:3000/api/hub/discussions

# Get opportunities
curl http://localhost:3000/api/hub/opportunities
```

### 3. Manual Testing
- Navigate to http://localhost:3000/hub
- Browse projects, discussions, and opportunities
- Create test entries
- Verify database entries appear

## Customization Points

### Adding More Opportunity Types
In `hub_opportunities.ts`:
```typescript
CHECK (opportunity_type IN ('job', 'freelance', 'internship', 'collaboration', 'mentorship', 'consulting'))
```

### Adding More Project Categories
In create forms and database schema

### Custom Skill Tags
Update the skills_required and skills fields to support your specific skills taxonomy

## Performance Considerations

All main query tables have indexes:
- `hub_projects.creator_id`
- `hub_projects.status`
- `hub_discussions.type`
- `hub_discussions.creator_id`
- `hub_opportunities.status`

Add more indexes if needed based on your filtering patterns:

```sql
CREATE INDEX idx_hub_discussions_created_at ON hub_discussions(created_at DESC);
CREATE INDEX idx_hub_projects_category ON hub_projects(category);
```

## Troubleshooting

### Page Won't Load
- Check browser console for errors
- Verify API endpoints start with `/api/hub/`
- Check Supabase connection in .env.local

### RLS Policy Errors
- Ensure user is authenticated
- Check RLS policies in Supabase dashboard
- Review the policies in create_hub_tables.sql

### Forms Not Submitting
- Check browser network tab for API response
- Verify user_id is being passed correctly
- Check Supabase logs for error details

## Next Steps

1. **Test the feature** - Navigate to `/hub` and test creating content
2. **Integrate authentication** - Update API endpoints to use real user IDs
3. **Add navigation links** - Link from main app to Hub
4. **Customize styling** - Adjust colors and layouts to match your brand
5. **Deploy** - Push to production
6. **Promote feature** - Let users know about the Hub

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Files Created

```
supabase/migrations/create_hub_tables.sql
src/pages/api/hub/members.ts
src/pages/api/hub/projects.ts
src/pages/api/hub/discussions.ts
src/pages/api/hub/opportunities.ts
src/pages/hub/index.tsx
src/pages/hub/projects/index.tsx
src/pages/hub/projects/new.tsx
src/pages/hub/discussions/index.tsx
src/pages/hub/discussions/new.tsx
src/pages/hub/opportunities/index.tsx
src/pages/hub/opportunities/new.tsx
HUB_FEATURE_DOCUMENTATION.md
HUB_IMPLEMENTATION_GUIDE.md
```

Total implementation includes:
- **1 Migration file** with 9 tables and RLS policies
- **4 API endpoints** for CRUD operations
- **7 Page components** for UI/UX
- **2 Documentation files**

## Quality Assurance Checklist

- [ ] Database migration runs without errors
- [ ] All tables created successfully
- [ ] RLS policies are active
- [ ] API endpoints return proper responses
- [ ] Form validation works
- [ ] Data persists correctly
- [ ] Filtering functionality works
- [ ] Pagination works correctly
- [ ] Mobile responsive design works
- [ ] Authentication integration complete
