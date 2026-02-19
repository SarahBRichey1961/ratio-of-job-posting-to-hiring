# Day 4: Build Scraper Framework

## Overview

Day 4 focuses on building a robust, extensible scraper framework for collecting job listings from multiple job boards. The framework includes:

- **Base Scraper Class**: Abstract class for all scrapers to extend
- **Logging System**: Comprehensive logging with file output
- **Error Handling**: Custom error types for different failure scenarios
- **Configuration**: Centralized scraper configuration
- **Sample Implementations**: Template scrapers for Indeed, LinkedIn, ZipRecruiter, and Stack Overflow

## Architecture

### File Structure

```
src/
├── lib/
│   └── logging/
│       ├── logger.ts          # Logging utility
│       ├── errors.ts          # Custom error types
│       └── baseScraper.ts     # Abstract base class
├── scrapers/
│   ├── config.ts              # Scraper configuration
│   └── implementations.ts     # Concrete scraper implementations
scripts/
└── scrapers/
    └── runScrapers.ts         # Script to run all scrapers
```

## Core Components

### 1. Logger (`src/lib/logging/logger.ts`)

Comprehensive logging system that:
- Outputs to console and files
- Supports multiple log levels (DEBUG, INFO, WARN, ERROR)
- Creates timestamped log files in `logs/` directory
- Includes structured logging with metadata

**Usage:**
```typescript
import { Logger, LogLevel } from '@/lib/logging/logger'

const logger = new Logger('logs', LogLevel.INFO)
logger.info('Starting scrape')
logger.debug('Processing item', { itemId: 123 })
logger.warn('Rate limit approaching', undefined, error)
logger.error('Failed to save data', error, { boardName: 'Indeed' })
```

### 2. Error Classes (`src/lib/logging/errors.ts`)

Custom error types for better error handling:
- `ScraperError`: Base error class
- `NetworkError`: HTTP/network failures
- `ParseError`: HTML parsing failures
- `DatabaseError`: Database operation failures
- `ValidationError`: Data validation failures
- `RateLimitError`: Rate limiting triggered

### 3. Base Scraper (`src/lib/logging/baseScraper.ts`)

Abstract class that all scrapers extend. Provides:

**Core Methods:**
- `scrape()`: Abstract method - implement per board
- `fetchUrl()`: Fetch URL with error handling
- `saveListings()`: Save jobs to database (upsert by URL)
- `recordEvent()`: Record posting appearance/disappearance events
- `run()`: Main orchestration method

**Interface:**
```typescript
interface JobListing {
  title: string
  company: string
  url: string
  description?: string
  location?: string
  jobBoardId: number
  scrapedAt: Date
}

interface ScrapingResult {
  jobBoardId: number
  jobBoardName: string
  jobsScraped: number
  newJobs: number
  errors: any[]
  startTime: Date
  endTime: Date
  duration: number
}
```

### 4. Scraper Configuration (`src/scrapers/config.ts`)

Centralized configuration for all scrapers:

```typescript
interface ScraperConfig {
  jobBoardId: number
  jobBoardName: string
  baseUrl: string
  enabled: boolean
  searchQuery?: string
  maxPages?: number
  headless?: boolean
}
```

**Available Functions:**
- `getEnabledScrapers()`: Get only enabled scrapers
- `getScraperConfig(id)`: Get config by board ID
- `getScraperConfigByName(name)`: Get config by board name

### 5. Sample Implementations (`src/scrapers/implementations.ts`)

Template scrapers for:
- **IndeedScraper**: Indeed.com
- **LinkedInScraper**: LinkedIn Jobs
- **ZipRecruiterScraper**: ZipRecruiter
- **StackOverflowScraper**: Stack Overflow

Each extends `BaseScraper` and implements the abstract `scrape()` method.

## Browser-Based Scraping Options

For job boards that load content dynamically with JavaScript, you'll need browser automation:

### Option 1: Puppeteer (Chromium-based)

```typescript
import puppeteer from 'puppeteer'

export class DynamicScraper extends BaseScraper {
  async scrape(): Promise<JobListing[]> {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    try {
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' })
      const content = await page.content()
      // Parse content with cheerio
      // ...
    } finally {
      await browser.close()
    }
  }
}
```

### Option 2: Playwright

```typescript
import { chromium } from 'playwright'

export class DynamicScraper extends BaseScraper {
  async scrape(): Promise<JobListing[]> {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    try {
      await page.goto(this.baseUrl)
      const content = await page.content()
      // Parse content with cheerio
      // ...
    } finally {
      await browser.close()
    }
  }
}
```

### Option 3: Cheerio (HTML parsing only)

For static HTML job boards:

```typescript
import cheerio from 'cheerio'

export class StaticScraper extends BaseScraper {
  async scrape(): Promise<JobListing[]> {
    const html = await this.fetchUrl(this.baseUrl)
    const $ = cheerio.load(html)

    const listings: JobListing[] = []
    $('div.job-card').each((_, element) => {
      const title = $(element).find('.job-title').text()
      const company = $(element).find('.company').text()
      const url = $(element).find('a').attr('href')

      listings.push({
        title,
        company,
        url,
        jobBoardId: this.jobBoardId,
        scrapedAt: new Date(),
      })
    })

    return listings
  }
}
```

## Running Scrapers

### Install Dependencies

```bash
npm install
# or
npm install cheerio puppeteer  # For specific tools
```

### Run All Enabled Scrapers

```bash
npx ts-node scripts/scrapers/runScrapers.ts
```

### Run Single Scraper

```bash
npx ts-node scripts/scrapers/runScrapers.ts --board=Indeed
npx ts-node scripts/scrapers/runScrapers.ts --board=ZipRecruiter
npx ts-node scripts/scrapers/runScrapers.ts --board=StackOverflow
```

## Creating a New Scraper

1. **Add configuration** in `src/scrapers/config.ts`:

```typescript
{
  jobBoardId: 99,
  jobBoardName: 'Example Board',
  baseUrl: 'https://example.com',
  enabled: true,
  searchQuery: 'javascript',
  maxPages: 5,
}
```

2. **Create scraper class** in `src/scrapers/implementations.ts`:

```typescript
export class ExampleScraper extends BaseScraper {
  constructor() {
    super(99, 'Example Board', 'https://example.com')
  }

  async scrape(): Promise<JobListing[]> {
    this.logger.info('Starting scrape')

    try {
      const html = await this.fetchUrl(this.baseUrl)
      // Parse HTML and extract jobs
      const listings: JobListing[] = []

      // ... parsing logic ...

      return listings
    } catch (error) {
      this.logger.error('Scraping failed', error as Error)
      throw error
    }
  }
}
```

3. **Add to runner** in `scripts/scrapers/runScrapers.ts`:

```typescript
const scrapers = [
  new IndeedScraper(),
  new ExampleScraper(),  // Add here
  new ZipRecruiterScraper(),
]
```

## Best Practices

### Rate Limiting
- Add delays between requests
- Check robots.txt
- Respect `Retry-After` headers
- Use rotating proxies if needed

### Error Handling
- Catch and log specific errors
- Implement retry logic with exponential backoff
- Record failed scrapes to database

### Data Quality
- Validate scraped data before saving
- Normalize data format (titles, locations)
- Deduplicate listings by URL

### Performance
- Cache HTML when possible
- Use headless browsers only when needed
- Batch database operations
- Monitor memory usage for long-running scrapes

## Example Output

When running scrapers, you'll see:

```
SCRAPING SUMMARY
============================================================

Indeed:
  Jobs Scraped: 150
  New Jobs: 45
  Duration: 8234ms
  Errors: 0

ZipRecruiter:
  Jobs Scraped: 89
  New Jobs: 23
  Duration: 5123ms
  Errors: 0

StackOverflow:
  Jobs Scraped: 0
  New Jobs: 0
  Duration: 1250ms
  Errors: 1

------------------------------------------------------------
TOTAL JOBS SCRAPED: 239
TOTAL NEW JOBS: 68
TOTAL ERRORS: 1
------------------------------------------------------------

Log file: logs/scraper-2024-02-18.log
```

## Testing

To test your scrapers locally without hitting real job boards:

```typescript
// Mock scraper for testing
export class MockScraper extends BaseScraper {
  async scrape(): Promise<JobListing[]> {
    return [
      {
        title: 'Software Engineer',
        company: 'Test Corp',
        url: 'https://example.com/job/123',
        jobBoardId: this.jobBoardId,
        scrapedAt: new Date(),
      },
    ]
  }
}
```

## Scheduling (Future - Day 8)

For daily automated scraping, use Supabase Edge Functions or a cron job service:

```typescript
// Example cron job (Days 8+)
import cron from 'node-cron'
import { runAllScrapers } from './runScrapers'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await runAllScrapers()
})
```

## Checklist

- [x] Create Logger class
- [x] Create custom error types
- [x] Create BaseScraper abstract class
- [x] Create scraper configuration system
- [x] Add sample scraper implementations
- [x] Create scraper runner script
- [x] Add dependencies to package.json
- [ ] Implement actual HTML scraping logic (requires real target site analysis)
- [ ] Test with actual job boards
- [ ] Implement retry/backoff logic
- [ ] Add rate limiting
- [ ] Set up scheduled scraping

## Next Steps (Day 5)

Day 5 focuses on normalizing job titles and roles, which is critical for accurate scoring and analytics.
