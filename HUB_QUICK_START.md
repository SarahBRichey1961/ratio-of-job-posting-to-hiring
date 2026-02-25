# Hub Feature - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Run Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or manually:
# 1. Go to Supabase Dashboard
# 2. SQL Editor
# 3. Open supabase/migrations/create_hub_tables.sql
# 4. Copy and paste entire file
# 5. Run query
```

### 2. Test the Hub
Navigate to: `http://localhost:3000/hub`

You should see:
- Hub home page with feature overview
- Tabs for Projects, Discussions, Opportunities
- Create buttons for each section

### 3. Add Navigation Link
Find your main navigation (likely in `src/components/Navigation.tsx` or similar):

```tsx
<Link href="/hub">
  <a>AI Hub</a>
</Link>
```

Done! 🎉

## 📋 What's Available Now

| Feature | URL | Status |
|---------|-----|--------|
| Hub Home | `/hub` | ✅ Ready |
| Browse Projects | `/hub/projects` | ✅ Ready |
| Create Project | `/hub/projects/new` | ✅ Ready |
| Browse Discussions | `/hub/discussions` | ✅ Ready |
| Create Discussion | `/hub/discussions/new` | ✅ Ready |
| Browse Opportunities | `/hub/opportunities` | ✅ Ready |
| Post Opportunity | `/hub/opportunities/new` | ✅ Ready |
| Project Details | `/hub/projects/[id]` | 🔲 Scaffold ready |
| Discussion Details | `/hub/discussions/[id]` | 🔲 Scaffold ready |
| Opportunity Details | `/hub/opportunities/[id]` | 🔲 Scaffold ready |

## 🔐 Important: Authentication Integration

**⚠️ BEFORE GOING LIVE:**

Find and replace `'user-id-here'` in these files:

1. `src/pages/api/hub/projects.ts`
2. `src/pages/api/hub/discussions.ts`
3. `src/pages/api/hub/opportunities.ts`
4. `src/pages/hub/projects/new.tsx`
5. `src/pages/hub/discussions/new.tsx`
6. `src/pages/hub/opportunities/new.tsx`

Replace with actual user ID from your auth system:

```typescript
// Instead of:
creator_id: 'user-id-here'

// Use:
const session = await getSession(context) // or your auth method
creator_id: session.user.id
```

## 📊 API Endpoints

```bash
# List/Create Members
GET /api/hub/members?search=...&skills=...
POST /api/hub/members

# List/Create Projects
GET /api/hub/projects?status=...&category=...&difficulty=...
POST /api/hub/projects

# List/Create Discussions
GET /api/hub/discussions?type=...&category=...&status=...
POST /api/hub/discussions

# List/Create Opportunities
GET /api/hub/opportunities?opportunity_type=...&search=...
POST /api/hub/opportunities
```

## 🎨 Customization

### Change Hub Theme Color
Find `indigo-600` in hub pages and replace with your brand color:

```tsx
// From:
className="bg-indigo-600 text-white"

// To:
className="bg-blue-600 text-white"  // or any Tailwind color
```

### Add New Project Category
In `src/pages/hub/projects/new.tsx`, update the select:

```tsx
<option value="reinforcement-learning">Reinforcement Learning</option>
<option value="nlp">Natural Language Processing</option>
// Add your categories here
```

### Change Opportunity Types
Update both the form and the database. In `src/pages/hub/opportunities/new.tsx`:

```tsx
<option value="bootcamp">Bootcamp</option>
<option value="research">Research</option>
// Add your types here
```

## 🧪 Quick Test

### Test Project Creation
1. Go to `/hub/projects/new`
2. Fill in form (all fields required except target date)
3. Click "Create Project"
4. Should redirect to `/hub/projects/[id]` (404 is OK for now)
5. Check Supabase dashboard - row should appear in `hub_projects` table

### Test Discussion
1. Go to `/hub/discussions/new`
2. Fill in title, description, type
3. Add a tag
4. Submit
5. Verify in database: `SELECT * FROM hub_discussions;`

### Test Opportunity
1. Go to `/hub/opportunities/new`
2. Fill required fields
3. Add skills
4. Submit
5. See in database: `SELECT * FROM hub_opportunities;`

## 🐛 Troubleshooting

**Pages show 404 errors:**
- Check URLs are spelled correctly in routes
- Verify Next.js dev server is running

**API returns 401 Unauthorized:**
- Check if authentication is integrated
- Verify bearer token is being sent

**Database shows no data:**
- Verify migration was run
- Check Supabase dashboard - tables exist?
- Check RLS policies aren't blocking access

**Forms don't submit:**
- Check browser console for errors
- Verify API endpoint is responding
- Check network tab for failed requests

## 📖 Full Documentation

For complete details, see:
- `HUB_FEATURE_DOCUMENTATION.md` - Feature overview
- `HUB_IMPLEMENTATION_GUIDE.md` - Complete implementation details
- `HUB_SUMMARY.md` - Full feature summary

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Test `/hub` page loads
3. ✅ Integrate authentication (replace 'user-id-here')
4. ✅ Add navigation links
5. ✅ Test create functionality with real user IDs
6. ✅ Build detail pages for projects/discussions/opportunities
7. ✅ Add application/commenting functionality
8. ✅ Deploy to production
9. ✅ Promote to users

## 💡 Tips

**For Beginners:**
- Start by just viewing the pages
- Test creating entries through forms
- Check database to see data persists

**For Experienced Developers:**
- Add real-time features with Supabase subscriptions
- Build user profiles with portfolio display
- Add notifications for new opportunities
- Implement achievement/badge system

**For Product Managers:**
- Track which features get the most engagement
- Gather user feedback on what's most valuable
- Iterate based on community needs

---

**Ready to go!** Start with step 1 and let us know if you hit any issues.
