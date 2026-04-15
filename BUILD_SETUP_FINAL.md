# Build the Damn Thing - Setup Guide (April 15, 2026)

## Why It's Not Working

The "Build the Damn Thing" feature creates **new GitHub repos** and **new Netlify sites**. It needs special tokens to do this.

Your site is missing these environment variables:
- ❌ `GITHUB_TOKEN`
- ❌ `NETLIFY_TOKEN`  
- ❌ `GITHUB_USERNAME`

---

## Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Token name:** `build-the-damn-thing-token`
   - **Expiration:** 90 days (or No expiration)
   - **Scopes:** Check ☑️ `repo` and ☑️ `user`
4. Click **"Generate token"**
5. **COPY the token immediately** (you won't see it again)
6. Save it somewhere safe temporarily

---

## Step 2: Create Netlify API Token

1. Go to: https://app.netlify.com/user/applications/personal-access-tokens
2. Click **"New access token"**
3. Give it a name: `build-the-damn-thing`
4. Click **"Generate token"**
5. **COPY the token immediately**
6. Save it somewhere safe temporarily

---

## Step 3: Add to Netlify Environment Variables

1. Go to: https://app.netlify.com/sites/take-the-reins/settings/deploys#environment
2. Click **"Edit variables"**
3. Add these three new variables:

```
GITHUB_TOKEN=[paste your GitHub token from Step 1]

NETLIFY_TOKEN=[paste your Netlify token from Step 2]

GITHUB_USERNAME=[your GitHub username, e.g., SarahBRichey1961]
```

4. Click **"Save"**
5. Site will rebuild in 1-3 minutes

---

## Step 4: Test It

1. Go to: https://take-the-reins.ai/hub/build
2. Try to build an app
3. Check if it works!

---

## Troubleshooting

If it still doesn't work:
- Visit: https://take-the-reins.ai/api/hub/build-status
- It will show you which variables are missing or invalid
- Re-check the tokens are correct

---

## Security Note

⚠️ These tokens are sensitive - they allow creating repos/sites on your account.

- Never commit them to git
- Only valid in Netlify environment variables
- If you think they're compromised, regenerate them
