# Build the Damn Thing! - Setup Guide (Option 1: Your Tokens)

## Overview

This MVP version uses **your personal GitHub and Netlify tokens**. When users click "Build It, Test It, Deploy It!", their apps are:
- Created as repos under **your GitHub account**
- Deployed under **your Netlify account**

**Users need zero setup** - it just works!

## 🔧 One-Time Setup (You Do This Once)

### Step 1: Generate GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `take-the-reins-build` (or any name you want)
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Read user profile data)
5. Click **"Generate token"**
6. **Copy the token** (save it somewhere safe - you won't see it again!)

### Step 2: Generate Netlify Personal Access Token

1. Go to https://app.netlify.com/user/settings/applications
2. Scroll to **"Personal access tokens"**
3. Click **"New access token"**
4. Name: `take-the-reins-build`
5. Click **"Generate token"**
6. **Copy the token**

### Step 3: Add to Netlify Environment Variables

1. Go to your **Netlify site dashboard**
2. Click **"Site settings"**
3. Go to **"Build & Deploy"** → **"Environment"**
4. Click **"Edit variables"**
5. Add three new variables:

| Key | Value |
|-----|-------|
| `GITHUB_TOKEN` | (paste your GitHub token) |
| `NETLIFY_TOKEN` | (paste your Netlify token) |
| `GITHUB_USERNAME` | `SarahBRichey1961` |

6. Click **"Save"**
7. **Redeploy** your site (push new code or manually trigger a redeploy)

### Step 4: Test It

1. Go to https://take-the-reins.ai/hub/build
2. Fill in your idea details
3. Click **"Build It, Test It, Deploy It!"**
4. Watch the loading overlay
5. A new window opens with your live app! 🎉

## 🚀 How Users Experience It

Users simply:
1. Fill out their idea on `/hub/build`
2. Wait for AI analysis
3. See their prototype
4. Click **"Build It, Test It, Deploy It!"**
5. **Their app opens in a new tab - LIVE on the internet!**

No token setup, no friction, just works.

## 📊 What Gets Created

Each time someone builds:
- **New GitHub repo** (named `app-{idea-name}-{timestamp}`)
  - Full Next.js project
  - Build plan in README
  - All source code included
  - Could be forked/cloned by the user later

- **New Netlify site** (auto-deployed from GitHub)
  - Live URL: `https://app-{random}.netlify.app`
  - Auto-updates when repo is pushed
  - Free hosting

## 🔒 Security Notes

- Tokens are **server-side only** (stored in Netlify env vars)
- Never exposed to the frontend
- Only used by `/api/hub/build-and-deploy`
- If token leaks, you can regenerate at any time

## 🛠️ Maintenance

**Rate limits:**
- GitHub: 5,000 requests/hour per token
- Netlify: 2,000 builds/month on free tier

**If you hit limits:**
- Upgrade GitHub to create more repos
- Upgrade Netlify for more builds
- Implement user-provided tokens later (Option 2/3)

## ✅ You're Done!

Once you complete the 4 steps above, the feature is ready for anyone to use. No additional setup needed per user.
