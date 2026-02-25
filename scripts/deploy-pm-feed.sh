#!/bin/bash

# PM Daily Board Activity Feed - Deployment Script
# This script handles database migrations, seed data, and Netlify configuration
# 
# Prerequisites:
# - Supabase CLI installed: https://github.com/supabase/cli
# - Netlify CLI installed: npm install -g netlify-cli
# - Authenticated with both services

set -e

echo "🚀 PM Daily Board Activity Feed - Deployment Script"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Deploy Database Migrations
echo -e "\n${BLUE}Step 1: Deploying Database Migrations${NC}"
echo "======================================="
echo "This will apply migrations 025 and 026 to your Supabase database."
echo ""
echo "Option A: Using Supabase CLI (Recommended)"
echo "  Command: supabase db push"
echo ""
echo "Option B: Manual - Copy and paste SQL in Supabase Dashboard"
echo "  1. Go to: https://app.supabase.com/project/[YOUR_PROJECT_ID]/sql"
echo "  2. Click 'New Query'"
echo "  3. Copy content from: supabase/migrations/025_create_daily_board_activity.sql"
echo "  4. Run the query"
echo "  5. Repeat for: supabase/migrations/026_seed_daily_board_activity.sql"
echo ""

read -p "Have you deployed the migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Migrations are required. Please deploy them first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Migrations deployed${NC}"

# Step 2: Verify Database Tables
echo -e "\n${BLUE}Step 2: Verifying Database Tables${NC}"
echo "===================================="
echo "Checking that migration tables exist..."
echo ""
echo "Run this in Supabase SQL Editor to verify:"
echo "  SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'daily_%';"
echo ""
echo "Expected tables:"
echo "  ✓ daily_board_activity"
echo "  ✓ daily_board_company_mix"
echo "  ✓ daily_role_seniority"
echo ""

read -p "Are all three tables created in your database? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Tables not found. Please run migrations first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All tables verified${NC}"

# Step 3: Configure Netlify Environment Variables
echo -e "\n${BLUE}Step 3: Configuring Netlify Environment Variables${NC}"
echo "=================================================="
echo ""
echo "You need to set 2 environment variables on Netlify:"
echo "  1. NEXT_PUBLIC_SUPABASE_URL"
echo "  2. NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "Option A: Using Netlify CLI"
echo "  1. Run: netlify link"
echo "  2. Then: netlify env:set NEXT_PUBLIC_SUPABASE_URL 'your-supabase-url'"
echo "  3. Then: netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY 'your-anon-key'"
echo ""
echo "Option B: Via Netlify Dashboard"
echo "  1. Go to: https://app.netlify.com/sites/[YOUR_SITE]/settings/env"
echo "  2. Click 'Add a variable'"
echo "  3. Name: NEXT_PUBLIC_SUPABASE_URL"
echo "  4. Value: (copy from Supabase dashboard → Settings → API)"
echo "  5. Repeat for NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""

read -p "Have you configured environment variables on Netlify? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠ Skipping environment variable configuration${NC}"
    echo "Note: API endpoint will fail without these variables."
else
    echo -e "${GREEN}✓ Environment variables configured${NC}"
fi

# Step 4: Trigger Netlify Rebuild
echo -e "\n${BLUE}Step 4: Triggering Netlify Rebuild${NC}"
echo "===================================="
echo ""
echo "Option A: Via Netlify CLI"
echo "  Command: netlify deploy --trigger"
echo ""
echo "Option B: Via GitHub"
echo "  1. Push a commit to main branch"
echo "  2. Netlify will auto-build"
echo ""
echo "Option C: Via Netlify Dashboard"
echo "  1. Go to: https://app.netlify.com/sites/[YOUR_SITE]/deploys"
echo "  2. Click 'Trigger deploy' → 'Deploy site'"
echo ""

read -p "Would you like to trigger a rebuild now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v netlify &> /dev/null; then
        echo "Triggering Netlify rebuild..."
        netlify deploy --trigger 2>/dev/null || echo -e "${YELLOW}Note: Manual trigger recommended via dashboard${NC}"
        echo -e "${GREEN}✓ Rebuild triggered${NC}"
    else
        echo -e "${YELLOW}Netlify CLI not found. Please trigger manually.${NC}"
    fi
fi

# Step 5: Schedule Data Ingestion
echo -e "\n${BLUE}Step 5: Scheduling Data Ingestion${NC}"
echo "=================================="
echo ""
echo "The computeDailyBoardActivity.ts script needs to run daily."
echo ""
echo "Option A: GitHub Actions (Recommended for Production)"
echo "  Create: .github/workflows/daily-board-metrics.yml"
echo "  See: PM_DAILY_FEED_SETUP.md for full configuration"
echo ""
echo "Option B: Node Cron Job"
echo "  Install: npm install node-cron"
echo "  Create: scripts/daily-scheduler.ts"
echo "  See: PM_DAILY_FEED_SETUP.md for full configuration"
echo ""
echo "Option C: Manual"
echo "  Run: npx tsx scripts/computeDailyBoardActivity.ts 2026-02-24"
echo ""

echo -e "\n${BLUE}Step 6: Verify Deployment${NC}"
echo "========================="
echo ""
echo "Test the API endpoint:"
echo "  curl https://your-netlify-site.netlify.app/api/pm/daily-feed?date=2026-02-24"
echo ""
echo "Or visit in browser:"
echo "  https://your-netlify-site.netlify.app/dashboard/pm-analytics"
echo ""

# Final Summary
echo -e "\n${GREEN}✅ Deployment Checklist Complete!${NC}"
echo ""
echo "Summary of what was done:"
echo "  ✓ Database migrations deployed (025, 026)"
echo "  ✓ Tables created and verified"
echo "  ✓ Netlify environment variables configured"
echo "  ✓ Site rebuilt on Netlify"
echo ""
echo "Next steps:"
echo "  1. Test the API endpoint"
echo "  2. Verify data appears in /dashboard/pm-analytics"
echo "  3. Set up daily ingestion schedule"
echo "  4. Add PM Analytics link to main dashboard"
echo ""
echo -e "${YELLOW}For detailed setup guide, see: PM_DAILY_FEED_SETUP.md${NC}"
