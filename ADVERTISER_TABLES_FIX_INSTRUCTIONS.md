# 🔧 CRITICAL FIX: Create Missing Advertiser Tables in Supabase

## Problem Identified ❌
```
Failed to fetch advertiser account: Could not find the table 'public.advertiser_accounts' in the schema cache
```

**Root Cause:** The `advertiser_accounts` table doesn't exist in your production Supabase database.

**Why it happened:** 
- The migration file was missing `payment_status` and `subscription_type` columns
- These columns are required by all the API code
- Supabase migrations weren't applied properly

---

## ✅ Solution: Apply SQL to Create Tables

### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Log in with your account
3. Click on your project: **"ratio-of-job-posting-to-hiring"**

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** button (top left)

### Step 3: Paste and Run SQL
1. Open this file: **`APPLY_ADVERTISER_TABLES.sql`** in VS Code
2. **Copy ALL the SQL** from that file (starting with "DROP TABLE" through "-- Done!")
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 4: Verify Success
- ✅ Look for green checkmark and "Executed successfully" message
- ✅ All tables created: `advertiser_accounts`, `advertisements`, `ad_impressions`, `ad_clicks`, `sponsor_memberships`
- ✅ Sarah's account auto-created with PAID status

### Step 5: Test in Browser
1. **Clear cache:** Ctrl+Shift+Delete
2. **Go to:** https://takethereigns.netlify.app
3. **Log in as:** sarah@websepic.com
4. **You should see:**
   - ✅ Advertiser dashboard loads
   - ✅ Ad list displays
   - ✅ No "Failed to fetch" errors

---

## 📝 What the SQL Does

✅ **Drops old tables** (fresh start)  
✅ **Creates advertiser_accounts table** with all required columns:
- `payment_status` (default: 'unpaid')
- `subscription_type` (default: 'basic')
- Matches all code expectations

✅ **Creates related tables:**
- `advertisements` - the ads to display
- `ad_impressions` - tracks ad views
- `ad_clicks` - tracks ad clicks
- `sponsor_memberships` - sponsor info

✅ **Configures Row-Level Security (RLS)** - only users can access their own data

✅ **Creates indexes** - improves performance

✅ **Auto-creates Sarah's account** with:
- `payment_status = 'paid'` ✅
- `subscription_type = 'premium'`
- Can create ads immediately without payment

---

## 🚨 Important Notes

⚠️ **This will:**
- Delete any existing test data in these tables (fresh start)
- Create all 5 monetization tables
- Set up proper security policies
- Auto-populate Sarah's account

⚠️ **Do NOT do this if:**
- You have important ads/data in the tables already
- If so, tell me and I'll create a migration that preserves data

---

## ✅ After Running SQL

Once you run the SQL successfully:

1. **Browser should work:** sarah@websepic.com logs in → dashboard loads
2. **No 500 errors:** All API calls return data instead of errors
3. **Can create ads:** Click "Create New Ad" without payment errors
4. **GoTrueClient warnings:** May still appear (different issue)

---

## 🆘 If It Doesn't Work

1. **Check SQL ran without errors:** Look for red error text in Supabase editor
2. **Verify table creation:** Go to "Table Editor" in Supabase → you should see `advertiser_accounts` listed
3. **Check Sarah's account:** Run this query in SQL Editor:
   ```sql
   SELECT * FROM advertiser_accounts WHERE email = 'sarah@websepic.com' OR user_id = (SELECT id FROM auth.users WHERE email = 'sarah@websepic.com');
   ```
4. **Share error details** if something fails

---

## 📊 After Fix Complete

- [x] Tables created in Supabase ✓
- [x] Sarah's account set to PAID ✓
- [x] Payment verification code matches schema ✓
- [x] Dashboard should load ✓
- [x] Ad creation should work ✓

**Next:** Run the SQL, clear browser cache, test login. The dashboard should load without errors.
