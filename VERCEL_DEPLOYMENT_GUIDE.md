# Vercel Deployment Guide

## Environment Variables to Add

Copy these values into Vercel Dashboard → Project Settings → Environment Variables

### Production, Preview & Development (All Environments)

```
NEXT_PUBLIC_SUPABASE_URL=https://blhrazwlfzrclwaluqak.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NzQ2MjEsImV4cCI6MjA4NzA1MDYyMX0.YetoKqhF8-JUAo-Ynk3YakeasWamrR5wlGffwPjay8Q
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0
```

## Deployment Steps

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Log in with GitHub account

2. **Import Project (if not already there)**
   - Click "Add New" → "Project"
   - Select "ratio-of-job-posting-to-hiring"
   - Click "Import"

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the 3 values above to ALL environments (Production, Preview, Development)
   - Click Save

4. **Deploy to Production**
   - Click the "Deploy" button
   - Wait 2-5 minutes for build to complete
   - Once "Ready", click the production URL

5. **Set Up Database (in Supabase)**
   - Go to https://supabase.com/dashboard
   - Select project "blhrazwlfzrclwaluqak"
   - Go to SQL Editor
   - Create new query
   - Copy contents from `MIGRATIONS_COMBINED.sql`
   - Run query to create all tables

## Testing

Once deployed:
- Visit your production URL
- Dashboard should show 35 job boards
- All pages should load without errors
- Cron job will run weekly on Mondays at 9 AM

## Support

If deployment fails:
- Check Vercel build logs for errors
- Most likely cause: Missing environment variables
- Second cause: Database not migrated yet

