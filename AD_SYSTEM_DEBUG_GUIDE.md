# Ad System Debug & Setup Guide

## Problem
Ads are not displaying on production pages (dashboard/comparison, dashboard/search, hub).

## Root Cause Analysis
✅ **RLS Policy**: Correctly configured - allows anyone to view active ads
✅ **Component Logic**: AdRotationBanner properly fetches and renders ads
❌ **Missing Data**: No active advertisements exist in the database yet

## Solution

### Step 1: Create a Test Ad in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select the `ratio-of-job-posting-to-hiring` project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the SQL from [INSERT_TEST_AD.sql](./INSERT_TEST_AD.sql)
5. Click **Run**

This creates a test ad for Sarah's advertiser account.

### Step 2: Verify Ad Was Created

After running the SQL, you should see output like:

```
id                          title                               advertiser_id                    is_active  created_at
12345678-1234-1234-1234    WebSepic - Your Job Analytics...    87654321-4321-4321-4321         true       2024-01-15...
```

And the second query should show:
```
total_active_ads: 1
```

### Step 3: Test Ad Display in Production

After creating the test ad:

1. **Clear browser cache** and reload production pages:
   - https://websepic.com (hub page)
   - https://websepic.com/dashboard (search dashboard)
   - https://websepic.com/dashboard/comparison (comparison page)

2. **Look for the ad banner** - should appear as a clickable banner at the top of each page

3. **Open browser DevTools** (F12) and check the **Console** for debug logs:
   - Success: `Fetched 1 ads, 1 are active and not expired`
   - Error: `No active advertisements found for pageType: [page-type]`

### Step 4: Monitor Impressions

Ad impressions are automatically tracked. Verify tracking by:

1. Go to Supabase SQL Editor
2. Run:
```sql
SELECT * FROM ad_impressions ORDER BY created_at DESC LIMIT 10;
```

You should see impression records appearing as users visit pages with ads.

## Technical Details

### Component Changes Made
- Enhanced console logging with `[AdRotationBanner]` prefix
- Better error messages showing why ads aren't displaying
- All warnings now logged for debugging

### RLS Policy (advertisements table)
```sql
CREATE POLICY "Anyone can view active ads" ON advertisements 
FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
```

This allows:
- ✅ Unauthenticated users to see active, non-expired ads
- ✅ Public pages like hub, dashboard, comparison to display ads
- ✅ Ad impression/click tracking for any user session

### Ads Cannot Display If:
1. ❌ No ads with `is_active = true` in database
2. ❌ All ads have `expires_at` in the past
3. ❌ Supabase connection fails (check browser console)
4. ❌ Banner image URL is broken/unreachable

## Expected Behavior After Fix

- **Hub Page** (`/`): Ad banner appears at top
- **Dashboard Search** (`/dashboard`): Ad banner appears below search form
- **Dashboard Comparison** (`/dashboard/comparison`): Ad banner appears at top
- **Rotation**: Ads rotate every 2 minutes (or shorter if only 1 ad)
- **Tracking**: Impressions counted automatically, clicks tracked on ad interaction

## Debugging Checklist

- [ ] Test ad created in database (query returns 1+ rows)
- [ ] `is_active = true` for test ad
- [ ] `expires_at` is NULL or in the future
- [ ] Browser cache cleared after SQL insert
- [ ] DevTools console shows "Fetched 1 ads" message
- [ ] Ad banner visible on all three pages
- [ ] No 403 errors in network tab (RLS block)
- [ ] Clicking ad opens click_url correctly
- [ ] Impressions table shows tracking records

## Advertiser Dashboard

Users can also create ads through the UI at `/advertiser/dashboard`:

1. Login to advertiser dashboard
2. Create ad with:
   - Title
   - Description
   - Banner image URL (must be publicly accessible)
   - Click URL (destination when ad clicked)
   - Height (default 80px)
3. Ad automatically becomes active and visible site-wide (if `is_active = true`)

## Next Steps

1. ✅ Run INSERT_TEST_AD.sql in Supabase (Step 1)
2. ✅ Verify ad created (Step 2)
3. ✅ Test on production (Step 3)
4. ✅ Check impressions (Step 4)
5. Promote fix to production if not already deployed
