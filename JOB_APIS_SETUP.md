# Job API Setup Guide

Complete setup instructions for all supported job APIs.

## 1. JSearch API (RapidAPI) - Currently Integrated

**Status**: ✅ Already implemented in `JSearchProvider.ts`

**What it does**: Aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter, and more

**Cost**: 
- Free tier: 100 requests/month
- Paid: $9.99/month to $99.99/month

**Setup**:

1. Go to https://rapidapi.com/laimihans/api/jsearch
2. Click "Subscribe"
3. Choose a plan
4. Get your API Key from Dashboard
5. Add to `netlify.toml`:
   ```toml
   RAPIDAPI_KEY = "your-key-here"
   ```

**Environment Variable**: `RAPIDAPI_KEY`

**Notes**:
- Supports job type filtering (remote, hybrid, onsite)
- Returns 0 results if API key is invalid or expired
- Good fallback aggregator

---

## 2. Indeed API - Recommended as Primary

**Status**: ✅ Implemented in `IndeedProvider.ts`

**What it does**: Direct access to Indeed.com job listings

**Cost**: 
- Free tier: Limited requests
- Paid: Starting at $0/month (free tier) to $500+/month

**Setup**:

### Option A: Free Indeed API
1. Go to https://opensource.indeedeng.io/
2. Sign up for free
3. Get your API credentials
4. Add to `netlify.toml`:
   ```toml
   INDEED_API_KEY = "your-key-here"
   ```

### Option B: Indeed Talent API (Premium)
1. Go to https://developer.indeed.com/
2. Sign up and get approved
3. Get your API key
4. Add to `netlify.toml`:
   ```toml
   INDEED_API_KEY = "your-key-here"
   ```

**Environment Variable**: `INDEED_API_KEY`

**Notes**:
- Largest job database
- High quality results
- Supports comprehensive filtering
- **RECOMMENDED** as primary provider

---

## 3. Stack Overflow Jobs API - Free & Developer-Focused

**Status**: ✅ Implemented in `StackOverflowProvider.ts`

**What it does**: Stack Overflow Jobs board listings

**Cost**: Completely free, no API key required

**Setup**:

1. No signup needed!
2. API is publicly available
3. No environment variable needed
4. Automatically enabled

**Notes**:
- Perfect for developer/tech jobs
- No API key required
- Fast and reliable
- Limited to tech industry

---

## 4. LinkedIn API - Enterprise Only

**Status**: ✅ Implemented in `LinkedInProvider.ts` (requires enterprise access)

**What it does**: LinkedIn job postings

**Cost**: 
- $5,000 - $30,000+ per year
- Enterprise/corporate only
- Requires approval from LinkedIn

**Setup** (if you have enterprise access):

1. Go to https://business.linkedin.com/talent-solutions
2. Contact LinkedIn sales team
3. Get approved for API access
4. Receive API token
5. Add to `netlify.toml`:
   ```toml
   LINKEDIN_API_TOKEN = "your-token-here"
   ```

**Environment Variable**: `LINKEDIN_API_TOKEN`

**Notes**:
- Most expensive option
- Highest quality data
- Restrictive terms of service
- Not recommended unless you have enterprise agreement

---

## 5. Additional Free/Open APIs (Easy to Add)

### GitHub Jobs
**Cost**: Free, no API key needed
**Setup**: 
```
https://api.github.com/jobs?search={query}
```
**Implementation**: See TEMPLATE_PROVIDER.ts

### AngelList
**Cost**: Free API, no key needed
**Setup**:
```
https://api.angel.co/1/jobs?filter_tags[]=ruby
```
**Implementation**: Easy REST endpoint

### Dice
**Cost**: Free API
**Setup**:
```
https://api.dice.com/jobs
```

### We Work Remotely
**Cost**: Free RSS/API
**Setup**:
```
https://weworkremotely.com/categories/jobs/feed
```

---

## Complete Configuration Example

Add all keys to `netlify.toml`:

```toml
[context.production]
  environment = {
    NODE_ENV = "production",
    RAPIDAPI_KEY = "XXXX",
    INDEED_API_KEY = "XXXX",
    LINKEDIN_API_TOKEN = "XXXX",
    GITHUB_API_KEY = "XXXX",
    ANGELLIST_API_KEY = "XXXX"
  }
```

Or set in Netlify UI:
1. Go to **Settings → Build & Deploy → Environment**
2. Click **Edit Variables**
3. Add each key-value pair
4. Click **Deploy**

---

## Priority Order (Default)

Lower number = higher priority (tried first)

```
Indeed (40)           - Premium quality
StackOverflow (45)    - Free, developer jobs
JSearch (50)          - Good aggregator
LinkedIn (60)         - Expensive, last resort
Custom (0-100)        - Your providers
```

---

## Testing Each Provider

### Test JSearch
```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&providers=JSearch"
```

### Test Indeed
```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&providers=Indeed"
```

### Test Stack Overflow
```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&providers=StackOverflow"
```

### Test All (Recommended)
```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&limit=100"
```

---

## Recommended Minimum Setup

1. **JSearch** - Already working ✅
   - Free tier available
   - Good aggregator
   - Currently configured

2. **Stack Overflow** - Free ✅
   - No setup needed
   - Great for tech jobs
   - Already configured

**Result**: You have 2 working sources right now

---

## Recommended Full Setup

1. **Indeed** - Add this next
   - Free or paid
   - Best quality
   - Recommended primary source

2. **Stack Overflow** - Free bonus ✅
   - Already configured

3. **JSearch** - Fallback ✅
   - Already configured

**Result**: 3 diverse sources, excellent coverage

---

## Advanced Configuration

### In Code Example

```typescript
// src/pages/api/jobs/search-multi.ts

const orchestrator = new JobSearchOrchestrator([
  new IndeedProvider(),        // Priority 40 - Best quality
  new StackOverflowProvider(), // Priority 45 - Free & fast
  new JSearchProvider(),       // Priority 50 - Good fallback
  // new LinkedInProvider(),  // Priority 60 - Only if enterprise
  // new GithubJobsProvider(), // Custom provider
])
```

### Disable Provider Without Removing Code

```typescript
const indeed = new IndeedProvider()
if (!indeed.isConfigured()) {
  indeed.enabled = false
}
```

---

## Troubleshooting

### 0 Jobs Returned
1. Check API key is valid
2. Verify environment variables are set
3. Check API quotas/rate limits
4. Try different search terms

### 401 Unauthorized Errors
1. API key is invalid or expired
2. Regenerate API key
3. Update environment variable

### API Not Configured Warnings
1. Set environment variable in Netlify
2. Or hardcode for development only
3. Restart Next.js dev server

### Slow Search
1. Add timeout handling
2. Implement caching
3. Prioritize fast providers first

---

## Cost Breakdown (Annual)

| Provider | Cost | Priority | Notes |
|----------|------|----------|-------|
| Stack Overflow | $0 | ⭐⭐⭐ | Free, no setup |
| JSearch Free | $0 | ⭐⭐ | Limited requests |
| Indeed Free | $0 | ⭐⭐⭐ | Limited requests |
| JSearch Paid | $120/yr | ⭐⭐⭐ | 10,000 req/month |
| Indeed Paid | $500-2000/yr | ⭐⭐⭐⭐ | Enterprise quality |
| LinkedIn | $5000-30000/yr | ✗ | Not recommended |

**Recommendation**: Start with free tier of Indeed + Stack Overflow

---

## Next Steps

1. ✅ Keep JSearch (already working)
2. ✅ Keep Stack Overflow (already integrated)
3. 🔄 Sign up for Indeed free tier
4. 🔄 Add INDEED_API_KEY to environment
5. 🔄 Redeploy to test
6. ⏭️ (Optional) Add more providers as needed

---

## Support

See `JOB_PROVIDERS_SETUP.md` for:
- Architecture details
- How to create custom providers
- De-duplication logic
- Result aggregation
