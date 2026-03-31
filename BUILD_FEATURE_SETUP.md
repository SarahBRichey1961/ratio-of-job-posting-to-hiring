# Build the Damn Thing! - Environment Setup Guide

## ⚠️ Missing Environment Variables

The "Build It, Test It, Deploy It!" feature requires 3 environment variables to be set up in Netlify:

### Required Variables:
1. **GITHUB_TOKEN** - Personal access token for GitHub
2. **NETLIFY_TOKEN** - API token for Netlify
3. **GITHUB_USERNAME** - Your GitHub username

## 🔧 Setup Instructions

### Step 1: Get Your GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: `take-the-reins-build`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Read user profile data)
5. Click "Generate token"
6. **Copy the token** (you won't be able to see it again!)

### Step 2: Get Your Netlify Token
1. Go to https://app.netlify.com/user/settings/applications#personal-access-tokens
2. Click "New access token"
3. Name it: `take-the-reins-build`
4. **Copy the token**

### Step 3: Add to Netlify Environment Variables
1. Go to your Netlify site → **Site Settings**
2. Go to **Build & Deploy** → **Environment**
3. Click "Edit variables"
4. Add these three variables:
   - **Key:** `GITHUB_TOKEN` → **Value:** (paste your GitHub token)
   - **Key:** `NETLIFY_TOKEN` → **Value:** (paste your Netlify token)
   - **Key:** `GITHUB_USERNAME` → **Value:** `SarahBRichey1961` (your GitHub username)
5. Click "Save"
6. **Redeploy your site** (or push new code)

### Step 4: Test Locally (Optional)
Add to `.env.local`:
```
GITHUB_TOKEN=ghp_...your-token...
NETLIFY_TOKEN=...your-token...
GITHUB_USERNAME=SarahBRichey1961
```

Then run `npm run dev` and test the feature.

## 🚀 How It Works

Once set up, when you click "Build It, Test It, Deploy It!":

1. **Creates GitHub Repository**
   - New repo with your idea name
   - All source code included
   - Auto-setup for Netlify deployment

2. **Generates Next.js Project**
   - Tailwind CSS pre-configured
   - TypeScript ready
   - Build plan in README
   - Live URL in minutes

3. **Deploys to Netlify**
   - Live URL generated
   - Auto-opens in your browser
   - Updates automatically on git push

## 📋 Security Notes

- Never commit tokens to GitHub (they're in `.env.local` which is `.gitignored`)
- These tokens give access to create repos and deploy to your Netlify account
- You can revoke tokens at any time if needed
- The build feature only creates new repos; it doesn't access existing ones

## ❓ Troubleshooting

**"Missing required environment variables" error:**
- Check that all 3 variables are set in Netlify
- Verify you've redeployed after adding variables
- Check variable names are spelled exactly: `GITHUB_TOKEN`, `NETLIFY_TOKEN`, `GITHUB_USERNAME`

**"GitHub repo creation failed":**
- Check your GitHub token is valid and has `repo` scope
- Check your GitHub username is correct
- Ensure your GitHub account has the ability to create repos

**"Netlify deployment failed":**
- Check your Netlify token is valid
- Ensure your Netlify account is active
- Check that your account allows API deployments

## ✅ Next Steps

1. Set up the three environment variables in Netlify
2. Redeploy the site
3. Go to `/hub/build`
4. Write your idea
5. Click "Build It, Test It, Deploy It!"
6. Your live app will launch in a new tab!
