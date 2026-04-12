# ⚠️ CRITICAL: Netlify Environment Variables Backup

**Last Updated:** April 12, 2026 (Updated for OpenAI)

## EMERGENCY RESTORATION

If all Netlify environment variables are deleted again:

### Step 1: Go to Netlify Dashboard
https://app.netlify.com/sites/take-the-reins/settings/deploys#environment

### Step 2: Click "Edit variables"

### Step 3: Add these 8 variables:

**⚠️ NOTE:** Keys below are examples. Use actual keys from:
- Supabase: https://supabase.com/dashboard (project settings)
- OpenAI: https://platform.openai.com/api-keys
- RapidAPI: https://rapidapi.com/dashboard
- Serper: https://serper.dev/dashboard  
- Adzuna: https://developer.adzuna.com/dashboard

```
NEXT_PUBLIC_SUPABASE_URL = https://[your-project-id].supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_[your-anon-key]

SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[your-service-key]

OPENAI_API_KEY = sk-proj-[your-openai-key]

RAPIDAPI_KEY = [your-rapidapi-key]

SERPER_API_KEY = [your-serper-key]

ADZUNA_API_ID = [your-adzuna-id]

ADZUNA_API_KEY = [your-adzuna-key]
```

### Step 4: Click Save

Site will rebuild in 1-3 minutes.

---

## What Each Does

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase database URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public auth key |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL** - Enables analytics/INSERT/UPDATE operations |
| `OPENAI_API_KEY` | ChatGPT API for manifesto text generation |
| `RAPIDAPI_KEY` | JSearch API for job postings |
| `SERPER_API_KEY` | Serper API for job search (highest priority) |
| `ADZUNA_API_ID` | Adzuna job board ID |
| `ADZUNA_API_KEY` | Adzuna API authentication |

---

## If Any Variable Is Missing

- **SUPABASE_SERVICE_ROLE_KEY missing** → Analytics fail
- **OPENAI_API_KEY missing** → Manifesto generation returns 500 error
- **Job API keys missing** → Job search returns no results
- **All missing** → Site loads but all features fail

---

## Security Notes

- ✅ This file is in .gitignore (not committed)
- ✅ Passwords/Stripe keys are NOT stored here (forbidden by user preference)
- ⚠️ Keep this file safe - contains production API keys

## API Changes
- **April 12, 2026:** Switched from Anthropic Claude to OpenAI ChatGPT for manifesto generation
  - Anthropic URLs are unavailable/forbidden
  - Using OpenAI's more robust API instead
  - Updated code in `/src/pages/api/hub/manifesto/generate.ts`

## Created
April 12, 2026 - After critical Netlify env var deletion incident
