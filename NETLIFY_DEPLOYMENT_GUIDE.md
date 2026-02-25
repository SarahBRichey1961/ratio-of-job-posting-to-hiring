# Netlify Deployment Guide for Hub Feature

## Prerequisites
- GitHub account with the project repository pushed
- Netlify account (free tier available)
- Supabase project created with Hub tables migrated

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to GitHub:
```bash
git add .
git commit -m "Add Hub feature"
git push origin main
```

## Step 2: Connect to Netlify

### Option A: Connect GitHub to Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose "GitHub"
4. Authorize Netlify to access your GitHub account
5. Select the `ratio-of-job-posting-to-hiring` repository
6. Click "Deploy site"

### Option B: Manual Deploy
1. Go to [netlify.com](https://netlify.com)
2. Create a new site
3. Drag and drop the `.next/` folder (after running `npm run build`)

## Step 3: Configure Build Settings

In Netlify Dashboard, go to **Site settings** → **Build & deploy**:

**Build settings:**
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 18.x (or higher)

## Step 4: Add Environment Variables

In Netlify Dashboard, go to **Site settings** → **Build & deploy** → **Environment**

Add these variables (get them from your `.env.local` file):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Optional (if you have them):
```
RESEND_API_KEY=your_resend_key_if_using_email
```

## Step 5: Configure Supabase RLS Policies

In your Supabase project, ensure RLS is properly configured:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Policies**
3. Verify these policies are enabled (they should be from the migration):
   - `hub_members` - View all, update own
   - `hub_projects` - View all, update as owner/member
   - `hub_discussions` - View all, post as authenticated
   - `hub_opportunities` - View all, apply as authenticated

## Step 6: Deploy

Once environment variables are set:

1. Netlify will automatically rebuild and redeploy
2. Your site will be live at: `https://your-site-name.netlify.app`
3. Hub feature accessible at: `https://your-site-name.netlify.app/hub`

## Step 7: Test the Deployment

After deployment:
- ✅ Visit your Hub at `/hub`
- ✅ Test creating a project, discussion, or opportunity
- ✅ Verify database operations work via browser dev tools (Network tab)

## Troubleshooting

### Build Fails
- Check build logs in Netlify Dashboard
- Common issue: Missing environment variables
- Solution: Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### API Calls Fail with 401
- Issue: Supabase authentication not configured correctly
- Solution: Ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly in Netlify

### Database Errors
- Issue: RLS policies blocking access
- Solution: Verify policies are set in Supabase → Authentication → Policies

### Blank Pages at /hub
- Check browser console for errors
- Verify Supabase connection in Network tab
- Ensure environment variables are correctly set

## Next Steps After Deployment

### Implement Real Authentication
Replace placeholder `'user-id-here'` with actual Supabase session:

Current pattern in API routes:
```typescript
const userId = 'user-id-here'; // PLACEHOLDER
```

Update to:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;
if (!userId) return res.status(401).json({ error: 'Unauthorized' });
```

### Add Authentication UI
Create login/signup page for Hub users:
```typescript
// src/pages/hub/auth.tsx
// Use Supabase Auth UI or custom form
```

### Monitor & Analytics
- Set up Netlify Analytics in Site settings
- Monitor Supabase database usage
- Track daily active users

## Custom Domain (Optional)

In Netlify Dashboard:
1. Go to **Site settings** → **Domain management**
2. Click **Add domain**
3. Update DNS records if using external registrar
4. Enable HTTPS (automatic with Netlify)

## Deployment Status

✅ Hub Database - Created in Supabase
✅ Hub API Endpoints - Ready to deploy  
✅ Hub Frontend Pages - Ready to deploy
✅ Navigation Integration - Ready to deploy
⏳ Netlify Connection - Pending

You're ready to deploy! Follow Steps 1-6 to launch the Hub feature live.
