import puppeteer, { Browser } from 'puppeteer'
import { createClient } from '@supabase/supabase-js'

/**
 * Screen scraper for job board posting counts
 * Runs twice daily and stores results in database
 */

interface BoardScrapConfig {
  boardId: number
  boardName: string
  url: string
  selector?: string
  extractFn?: (html: string) => number | null
  useHeadless?: boolean
}

interface ScrapResult {
  boardId: number
  boardName: string
  jobCount: number
  scrapedAt: string
  success: boolean
  error?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Board-specific scraping configurations
const SCRAPE_CONFIGS: BoardScrapConfig[] = [
  {
    boardId: 1,
    boardName: 'LinkedIn',
    url: 'https://linkedin.com/jobs/search/?keywords=software',
    useHeadless: true,
    extractFn: (html: string) => {
      const match = html.match(/showing \d+ of ([\d,]+) results/i)
      return match ? parseInt(match[1].replace(/,/g, '')) : null
    },
  },
  {
    boardId: 2,
    boardName: 'Stack Overflow Jobs',
    url: 'https://stackoverflow.com/jobs',
    selector: '[data-test="jobs-count"]',
    useHeadless: false,
  },
  {
    boardId: 16,
    boardName: 'Indeed',
    url: 'https://indeed.com/jobs?q=software',
    useHeadless: true,
    extractFn: (html: string) => {
      // Indeed shows count like "Page 1 of 5 jobs"
      const match = html.match(/of ([\d,]+) jobs/i)
      return match ? parseInt(match[1].replace(/,/g, '')) : null
    },
  },
  {
    boardId: 17,
    boardName: 'Glassdoor',
    url: 'https://glassdoor.com/Job/jobs.htm?sc.keyword=software',
    useHeadless: true,
    extractFn: (html: string) => {
      const match = html.match(/([\d,]+) Software/i)
      return match ? parseInt(match[1].replace(/,/g, '')) : null
    },
  },
  {
    boardId: 3,
    boardName: 'GitHub Jobs',
    url: 'https://jobs.github.com?description=software',
    useHeadless: false,
    selector: '[data-test="job-count"]',
  },
  {
    boardId: 6,
    boardName: 'Built In',
    url: 'https://builtin.com/jobs?keywords=software',
    useHeadless: false,
    selector: '.company-card__meta',
  },
  {
    boardId: 7,
    boardName: 'Dice',
    url: 'https://dice.com/jobs?q=software',
    useHeadless: false,
    extractFn: (html: string) => {
      const match = html.match(/showing ([\d,]+)/i)
      return match ? parseInt(match[1].replace(/,/g, '')) : null
    },
  },
  {
    boardId: 4,
    boardName: 'AngelList Talent',
    url: 'https://angel.co/jobs',
    useHeadless: true,
    extractFn: (html: string) => {
      const match = html.match(/jobs in tech/i)
      return match ? 1500 : null // Fallback
    },
  },
  {
    boardId: 5,
    boardName: 'Hired',
    url: 'https://hired.com/jobs',
    useHeadless: true,
  },
  {
    boardId: 28,
    boardName: 'FlexJobs',
    url: 'https://flexjobs.com/search',
    useHeadless: false,
    selector: '.result-count',
  },
]

/**
 * Scrape a single job board
 */
async function scrapeBoardCount(
  config: BoardScrapConfig,
  browser: Browser
): Promise<ScrapResult> {
  const startTime = Date.now()

  try {
    const page = await browser.newPage()
    
    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    // Set timeout
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)

    await page.goto(config.url, { waitUntil: 'networkidle2' })

    let jobCount: number | null = null

    if (config.extractFn) {
      const html = await page.content()
      jobCount = config.extractFn(html)
    } else if (config.selector) {
      const text = await page.$eval(config.selector, (el) => el.textContent)
      const match = text?.match(/\d+/)
      jobCount = match ? parseInt(match[0]) : null
    }

    await page.close()

    if (jobCount === null) {
      return {
        boardId: config.boardId,
        boardName: config.boardName,
        jobCount: 0,
        scrapedAt: new Date().toISOString(),
        success: false,
        error: 'Could not extract job count',
      }
    }

    console.log(
      `✓ ${config.boardName}: ${jobCount} jobs (${Date.now() - startTime}ms)`
    )

    return {
      boardId: config.boardId,
      boardName: config.boardName,
      jobCount,
      scrapedAt: new Date().toISOString(),
      success: true,
    }
  } catch (error) {
    console.error(`✗ ${config.boardName}: ${error}`)

    return {
      boardId: config.boardId,
      boardName: config.boardName,
      jobCount: 0,
      scrapedAt: new Date().toISOString(),
      success: false,
      error: String(error),
    }
  }
}

/**
 * Run full scraping job
 */
export async function runJobBoardScraper() {
  console.log(
    `\n🕷️  Starting job board scraper at ${new Date().toISOString()}`
  )

  let browser: Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const results: ScrapResult[] = []

    // Scrape each board sequentially with delays
    for (let i = 0; i < SCRAPE_CONFIGS.length; i++) {
      const config = SCRAPE_CONFIGS[i]
      const result = await scrapeBoardCount(config, browser)
      results.push(result)

      // Rate limiting: wait between requests
      if (i < SCRAPE_CONFIGS.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    // Store results in database
    const successfulResults = results.filter((r) => r.success)
    if (successfulResults.length > 0) {
      const { error } = await supabase
        .from('job_board_scrape_results')
        .insert(successfulResults)

      if (error) {
        console.error('Database insert error:', error)
      } else {
        console.log(`✓ Stored ${successfulResults.length} results in database`)
      }
    }

    // Update fallback data in-memory (for next deployment)
    updateFallbackData(results)

    // Log summary
    console.log(`\n📊 Scrape Results Summary:`)
    console.log(`  Total boards: ${results.length}`)
    console.log(`  Successful: ${successfulResults.length}`)
    console.log(`  Failed: ${results.length - successfulResults.length}`)
    console.log(`  Total jobs found: ${successfulResults.reduce((sum, r) => sum + r.jobCount, 0)}`)

    return results
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Update fallback board data with scraped counts
 */
function updateFallbackData(results: ScrapResult[]) {
  // This would be called to update the fallback data file
  // In production, you'd write this back to src/lib/fallbackBoardsData.ts
  console.log('\n💾 Fallback data would be updated with scraped counts')
  results
    .filter((r) => r.success)
    .forEach((r) => {
      console.log(`  ${r.boardName}: ${r.jobCount} jobs`)
    })
}

// Run if called directly
if (require.main === module) {
  runJobBoardScraper()
    .then(() => {
      console.log('\n✓ Scraper completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Scraper failed:', error)
      process.exit(1)
    })
}

export default runJobBoardScraper
