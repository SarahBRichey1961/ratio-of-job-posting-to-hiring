# Multi-Provider Job Search Architecture

## Overview

This system allows you to search job listings from **any number of job APIs simultaneously**. It provides:

- ✅ **Modular provider system** - Easy to add new APIs
- ✅ **Parallel searches** - All APIs called at once for speed
- ✅ **De-duplication** - Single job won't appear twice
- ✅ **Graceful fallback** - If one API fails, others still work
- ✅ **Priority ordering** - Control which source appears first
- ✅ **Enable/disable** - Toggle providers on/off without code changes

## Architecture

```
JobSearchOrchestrator (Main controller)
    ├── JSearchProvider (RapidAPI - LinkedIn, Indeed, Glassdoor aggregator)
    ├── IndeedProvider (Direct Indeed API)
    ├── StackOverflowProvider (Developer jobs - free)
    ├── LinkedInProvider (Enterprise API - expensive)
    └── [Your Custom Providers Here]
```

## Quick Start

### 1. Search Using Multiple Providers

```typescript
import {
  JobSearchOrchestrator,
  JSearchProvider,
  IndeedProvider,
  StackOverflowProvider,
} from '@/lib/jobProviders'

// Create orchestrator with providers
const orchestrator = new JobSearchOrchestrator([
  new JSearchProvider(),
  new IndeedProvider(),
  new StackOverflowProvider(),
])

// Search
const results = await orchestrator.search({
  query: 'Senior Engineer',
  jobType: 'remote',
  limit: 50,
})

console.log(`Found ${results.totalJobs} jobs from ${results.sources.length} sources`)
```

### 2. API Usage

```bash
# Basic search
GET /api/jobs/search-multi?query=Product%20Manager

# With filters
GET /api/jobs/search-multi?query=Engineer&jobType=remote&limit=100

# Specific providers only
GET /api/jobs/search-multi?query=Engineer&providers=Indeed,JSearch
```

## Adding a New Job Provider

### Step 1: Extend BaseJobProvider

Create `src/lib/jobProviders/NewProviderName.ts`:

```typescript
import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

export class NewProviderNameProvider extends BaseJobProvider {
  name = 'Provider Name' // Display name
  priority = 50 // Lower = higher priority (0-100)
  private apiKey: string

  constructor() {
    super()
    this.apiKey = process.env.NEW_PROVIDER_API_KEY || ''
    this.enabled = this.isConfigured()
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  async search(params: JobSearchParams): Promise<JobProviderResponse> {
    try {
      if (!this.validateParams(params)) {
        return {
          success: false,
          jobs: [],
          error: 'Invalid parameters',
          provider: this.name,
        }
      }

      if (!this.isConfigured()) {
        this.log('⚠️ API key not configured')
        return {
          success: false,
          jobs: [],
          error: 'API key not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching for: ${params.query}`)

      // Call your API here
      const response = await fetch('https://api.example.com/search', {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: params.query,
          location: params.location,
          limit: params.limit,
        }),
      })

      const data = await response.json()

      // Map API response to JobListing format
      const jobs = (data.results || []).map((job: any) => ({
        id: job.id,
        title: job.job_title,
        company: job.company_name,
        location: job.location,
        url: job.apply_url,
        salary: job.salary_range,
        postedDate: new Date(job.posted_at).toISOString(),
        description: job.description,
        jobType: job.work_type?.toLowerCase(), // 'remote' | 'hybrid' | 'onsite'
        source: this.name,
      }))

      this.log(`✅ Found ${jobs.length} jobs`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.total_count || 0,
      }
    } catch (error) {
      this.logError('Search failed', error)
      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      }
    }
  }
}
```

### Step 2: Export Provider

Update `src/lib/jobProviders/index.ts`:

```typescript
export * from './NewProviderName'
```

### Step 3: Add Environment Variable

In `netlify.toml`:

```toml
[context.production]
  environment = { 
    NODE_ENV = "production",
    RAPIDAPI_KEY = "your-key",
    INDEED_API_KEY = "your-key",
    NEW_PROVIDER_API_KEY = "your-key"
  }
```

Or set in Netlify UI: **Settings → Build & Deploy → Environment → Edit Variables**

### Step 4: Use in Orchestrator

```typescript
import {
  JobSearchOrchestrator,
  JSearchProvider,
  NewProviderNameProvider,
} from '@/lib/jobProviders'

const orchestrator = new JobSearchOrchestrator([
  new NewProviderNameProvider(),
  new JSearchProvider(),
])
```

## Environment Variables

Set these in `netlify.toml` or Netlify UI:

```
RAPIDAPI_KEY = ""              # JSearch API key
INDEED_API_KEY = ""            # Indeed API key (if using direct API)
LINKEDIN_API_TOKEN = ""        # LinkedIn API token (enterprise)
NEW_PROVIDER_API_KEY = ""      # Your custom provider
```

## Provider Priorities

Lower number = higher priority (tries first)

```typescript
JSearchProvider:      priority = 50  // Good all-around aggregator
StackOverflowProvider: priority = 45  // Fast, free, developer-focused
IndeedProvider:       priority = 40  // High quality results
LinkedInProvider:     priority = 60  // Expensive, last resort
YourProvider:         priority = 35  // Set based on reliability
```

## Current Providers

### JSearch (RapidAPI)
- **What**: Aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter
- **Cost**: Free tier available, paid tiers
- **Key**: RAPIDAPI_KEY
- **Pros**: Broad aggregation, good coverage
- **Cons**: Aggregated data, not always up-to-date

### Indeed
- **What**: Direct Indeed.com API
- **Cost**: Free tier to $500+/month
- **Key**: INDEED_API_KEY
- **Pros**: High quality, primary source, good coverage
- **Cons**: Requires API key, GraphQL endpoint

### Stack Overflow
- **What**: Stack Overflow Jobs board
- **Cost**: Free, no API key needed
- **Key**: None required
- **Pros**: Quality developer jobs, fast
- **Cons**: Tech jobs only, limited scope

### LinkedIn
- **What**: LinkedIn Talent Solutions API
- **Cost**: $5,000-$30,000+/year
- **Key**: LINKEDIN_API_TOKEN
- **Pros**: Largest job database, high quality
- **Cons**: Expensive, enterprise-only, restrictive

## De-duplication

Jobs are de-duplicated by:
1. URL (primary - most reliable)
2. Title + Company (fallback)

Same job from multiple sources only appears once, with all sources credited.

## Handling API Failures

If an API fails:
- ✅ Other providers continue searching
- ✅ No error thrown to user
- ✅ Results include which providers succeeded/failed
- ✅ Graceful degradation

```typescript
{
  success: true,
  totalJobs: 45,
  jobs: [...],
  sources: ["JSearch", "StackOverflow"],
  providerResults: {
    JSearch: { success: true, count: 20 },
    Indeed: { success: false, error: "API key invalid" },
    StackOverflow: { success: true, count: 25 },
    LinkedIn: { success: false, error: "Not configured" }
  }
}
```

## Testing

### 1. Test Single Provider

```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&providers=JSearch"
```

### 2. Test All Providers

```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Product%20Manager&limit=50"
```

### 3. Test with Filters

```bash
curl "http://localhost:3000/api/jobs/search-multi?query=Engineer&jobType=remote&location=New%20York"
```

## Example Response

```json
{
  "success": true,
  "query": "Senior Engineer",
  "totalJobs": 127,
  "jobs": [
    {
      "id": "qwerty123",
      "title": "Senior Software Engineer",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "url": "https://...",
      "salary": "USD150000-180000",
      "postedDate": "2026-03-02T...",
      "description": "...",
      "jobType": "remote",
      "source": "Indeed"
    }
  ],
  "sources": ["Indeed", "JSearch", "StackOverflow"],
  "providerResults": {
    "Indeed": { "success": true, "count": 45 },
    "JSearch": { "success": true, "count": 50 },
    "StackOverflow": { "success": true, "count": 32 },
    "LinkedIn": { "success": false, "error": "Not configured" }
  },
  "configuration": {
    "enabledCount": 3,
    "providers": [
      { "name": "Indeed", "enabled": true, "priority": 40, "configured": true },
      { "name": "StackOverflow", "enabled": true, "priority": 45, "configured": true },
      { "name": "JSearch", "enabled": true, "priority": 50, "configured": true },
      { "name": "LinkedIn", "enabled": true, "priority": 60, "configured": false }
    ]
  }
}
```

## Best Practices

1. **Always validate API keys exist** before searching
2. **Set priorities based on reliability** (faster/better sources first)
3. **De-duplicate aggressively** to avoid showing same job twice
4. **Include source attribution** so users know origin
5. **Log everything** for debugging API issues
6. **Handle timeouts gracefully** for slow providers
7. **Cache results briefly** to avoid duplicate API calls
8. **Rate limit calls** if free tier APIs have restrictions

## Future Improvements

- [ ] Add caching layer (Redis/database)
- [ ] Implement exponential backoff for failed providers
- [ ] Add result relevance scoring
- [ ] Implement provider health checks
- [ ] Add job posting notifications
- [ ] Create web-based provider configuration UI
- [ ] Add webhook support for new job alerts
- [ ] Implement provider-specific field mapping
- [ ] Add job posting age filtering
- [ ] Create analytics dashboard for provider performance
