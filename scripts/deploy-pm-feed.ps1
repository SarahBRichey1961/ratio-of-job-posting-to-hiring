# PM Daily Board Activity Feed - Deployment Script (PowerShell)
# This script handles database migrations and Netlify configuration
# 
# Prerequisites:
# - Supabase CLI installed
# - Netlify CLI installed: npm install -g netlify-cli

Write-Host "🚀 PM Daily Board Activity Feed - Deployment Script" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Functions
function Pause-Script {
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Test-Credentials {
    Write-Host "`nVerifying credentials..." -ForegroundColor Blue
    
    # Check Supabase CLI
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Host "✓ Supabase CLI found" -ForegroundColor Green
    } else {
        Write-Host "✗ Supabase CLI not found. Install: npm install -g @supabase/cli" -ForegroundColor Red
        return $false
    }
    
    # Check Netlify CLI
    if (Get-Command netlify -ErrorAction SilentlyContinue) {
        Write-Host "✓ Netlify CLI found" -ForegroundColor Green
    } else {
        Write-Host "⚠ Netlify CLI not found. Install: npm install -g netlify-cli" -ForegroundColor Yellow
    }
    
    return $true
}

# Step 0: Verify Prerequisites
Write-Host "`n=== Step 0: Verifying Prerequisites ===" -ForegroundColor Blue
if (-not (Test-Credentials)) {
    Write-Host "`nDeployment cannot proceed without required tools." -ForegroundColor Red
    exit 1
}

# Step 1: Deploy Database Migrations
Write-Host "`n=== Step 1: Deploying Database Migrations ===" -ForegroundColor Blue
Write-Host @"
This will apply migrations 025 and 026 to your Supabase database.

OPTION A: Using Supabase CLI (Recommended)
  Command: supabase db push

OPTION B: Manual SQL in Supabase Dashboard
  1. Go to: https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql/new
  2. Copy and paste content from: supabase/migrations/025_create_daily_board_activity.sql
  3. Click 'Run'
  4. Repeat for: supabase/migrations/026_seed_daily_board_activity.sql

OPTION C: Using psql directly
  Command: psql -h db.SUPABASE_ID.supabase.co -U postgres -d postgres -f supabase/migrations/025_create_daily_board_activity.sql
"@

$response = Read-Host "`nHave you deployed the migrations? (y/n)"
if ($response -ne "y") {
    Write-Host "Migrations are required. Please deploy them first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migrations deployed" -ForegroundColor Green

# Step 2: Verify Database Tables
Write-Host "`n=== Step 2: Verifying Database Tables ===" -ForegroundColor Blue
Write-Host @"
Check that migration tables exist in Supabase.

Run this in your Supabase SQL Editor:
  SELECT tablename FROM pg_tables 
  WHERE schemaname='public' 
  AND tablename LIKE 'daily_%' 
  ORDER BY tablename;

Expected tables:
  ✓ daily_board_activity
  ✓ daily_board_company_mix
  ✓ daily_role_seniority
"@

$response = Read-Host "`nAre all three tables created? (y/n)"
if ($response -ne "y") {
    Write-Host "Tables not found. Please verify migrations ran successfully." -ForegroundColor Red
    exit 1
}
Write-Host "✓ All tables verified" -ForegroundColor Green

# Step 3: Configure Netlify Environment Variables
Write-Host "`n=== Step 3: Configuring Netlify Environment Variables ===" -ForegroundColor Blue
Write-Host @"
You need to set 2 environment variables on Netlify:
  1. NEXT_PUBLIC_SUPABASE_URL
  2. NEXT_PUBLIC_SUPABASE_ANON_KEY

Get these values from: https://app.supabase.com/project/[PROJECT_ID]/settings/api

OPTION A: Using Netlify CLI
  1. Open terminal in project directory
  2. Run: netlify env:set NEXT_PUBLIC_SUPABASE_URL 'your-url'
  3. Run: netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY 'your-key'

OPTION B: Via Netlify Dashboard
  1. Go to: https://app.netlify.com/sites/[YOUR_SITE]/settings/env
  2. Click 'Add a variable'
  3. Name: NEXT_PUBLIC_SUPABASE_URL
     Value: [from Supabase dashboard]
  4. Click 'Save'
  5. Repeat for NEXT_PUBLIC_SUPABASE_ANON_KEY

OPTION C: Using PowerShell (via CLI)
  `$url = Read-Host 'Enter SUPABASE_URL'
  `$key = Read-Host 'Enter SUPABASE_ANON_KEY'
  netlify env:set NEXT_PUBLIC_SUPABASE_URL `$url
  netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY `$key
"@

$response = Read-Host "`nHave you configured environment variables? (y/n)"
if ($response -eq "y") {
    Write-Host "✓ Environment variables configured" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping. API endpoint will fail without these." -ForegroundColor Yellow
}

# Step 4: Trigger Rebuild
Write-Host "`n=== Step 4: Triggering Netlify Rebuild ===" -ForegroundColor Blue
Write-Host @"
OPTION A: Using Netlify CLI
  Command: netlify deploy --trigger

OPTION B: Using GitHub
  Push a commit to main branch - Netlify will auto-build

OPTION C: Using Netlify Dashboard
  1. Go to: https://app.netlify.com/sites/[YOUR_SITE]/deploys
  2. Click 'Trigger deploy' → 'Deploy site'
"@

$response = Read-Host "`nTrigger rebuild now? (y/n)"
if ($response -eq "y") {
    if (Get-Command netlify -ErrorAction SilentlyContinue) {
        Write-Host "Triggering rebuild..." -ForegroundColor Cyan
        netlify deploy --trigger
        Write-Host "✓ Rebuild triggered" -ForegroundColor Green
    } else {
        Write-Host "⚠ Netlify CLI not found. Please trigger manually via dashboard." -ForegroundColor Yellow
    }
}

# Step 5: Schedule Data Ingestion
Write-Host "`n=== Step 5: Schedule Daily Data Ingestion ===" -ForegroundColor Blue
Write-Host @"
The computeDailyBoardActivity.ts script needs to run daily at 08:00 UTC.

OPTION A: GitHub Actions (Recommended)
  Create .github/workflows/daily-board-metrics.yml
  See PM_DAILY_FEED_SETUP.md for configuration

OPTION B: Windows Scheduled Task
  Create a task that runs:
  cmd.exe /k "cd C:\path\to\project && npx tsx scripts/computeDailyBoardActivity.ts"
  
  Schedule it to run daily at 08:00 UTC

OPTION C: Manual Test
  Run: npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24
"@

# Step 6: Verify
Write-Host "`n=== Step 6: Verify Deployment ===" -ForegroundColor Blue
Write-Host @"
Test the API endpoint:
  curl https://your-site.netlify.app/api/pm/daily-feed?date=2026-02-24

Or visit dashboard in browser:
  https://your-site.netlify.app/dashboard/pm-analytics

Check for:
  ✓ API returns JSON with board metrics
  ✓ Dashboard page loads without errors
  ✓ Data displays for today's date
"@

# Final Summary
Write-Host "`n" -ForegroundColor Green
Write-Host "✅ Deployment Checklist Complete!" -ForegroundColor Green
Write-Host @"
Summary:
  ✓ Database migrations deployed (025, 026)
  ✓ Tables verified in Supabase
  ✓ Environment variables configured
  ✓ Netlify site rebuilt

Next Steps:
  1. Test the API endpoint: /api/pm/daily-feed
  2. Verify PM Analytics dashboard loads
  3. Set up daily ingestion schedule
  4. Add PM Analytics to main dashboard navigation

For detailed guide: See PM_DAILY_FEED_SETUP.md
"@

Write-Host "Press any key to exit..." -ForegroundColor Yellow
Pause-Script
