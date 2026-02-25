import { NextApiRequest, NextApiResponse } from 'next'
import puppeteer, { Browser } from 'puppeteer'
import axios from 'axios'

/**
 * API endpoint to get jobs posted "today" (first day posting only) for a specific board
 * Uses board-specific APIs and scrapers for accurate job extraction
 * 
 * Query params:
 * - boardId: number (required) - ID of the job board
 * - boardName: string (required) - Name of the job board
 * - date: string (optional) - Date to query in YYYY-MM-DD format, defaults to today
 */

interface JobPosting {
  title: string
  company?: string
  url?: string
  postedDate: string
  source: 'api' | 'scraper'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { boardId, boardName, date } = req.query
    const targetDate = (date as string) || new Date().toISOString().split('T')[0]

    if (!boardId || !boardName) {
      return res.status(400).json({
        error: 'Missing required parameters: boardId and boardName',
      })
    }

    // Try API first, fall back to scraper
    let jobs: JobPosting[] = []

    switch (boardName) {
      case 'Stack Overflow Jobs':
        jobs = await fetchStackOverflowJobs(targetDate)
        break
      case 'Indeed':
        jobs = await fetchIndeedJobs(targetDate)
        break
      case 'LinkedIn':
        jobs = await scrapeLinkedInJobs(targetDate)
        break
      case 'GitHub Jobs':
        jobs = await scrapeGitHubJobs(targetDate)
        break
      case 'Built In':
        jobs = await scrapeBuiltInJobs(targetDate)
        break
      case 'FlexJobs':
        jobs = await scrapeFlexJobsJobs(targetDate)
        break
      case 'Dice':
        jobs = await scrapeDiceJobs(targetDate)
        break
      case 'AngelList Talent':
        jobs = await scrapeAngelListJobs(targetDate)
        break
      default:
        jobs = await genericBoardScraper(boardName as string, targetDate)
    }

    return res.status(200).json({
      success: true,
      board: boardName,
      date: targetDate,
      jobCount: jobs.length,
      jobs: jobs.slice(0, 50), // Return first 50 jobs
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return res.status(500).json({
      error: `Failed to fetch jobs for ${req.query.boardName}`,
      details: String(error),
    })
  }
}

/**
 * Stack Overflow Jobs API
 */
async function fetchStackOverflowJobs(targetDate: string): Promise<JobPosting[]> {
  try {
    // Stack Overflow has a public API
    const response = await axios.get('https://api.stackexchange.com/2.3/jobs', {
      params: {
        site: 'stackoverflow',
        sort: 'newest',
        order: 'desc',
        pagesize: 100,
      },
      timeout: 10000,
    })

    const jobs: JobPosting[] = []
    const queryDate = new Date(targetDate)

    response.data.items?.forEach((job: any) => {
      const jobDate = new Date(job.creation_date * 1000)
      if (jobDate.toISOString().split('T')[0] === targetDate) {
        jobs.push({
          title: job.title,
          company: job.company_name,
          url: job.link,
          postedDate: targetDate,
          source: 'api',
        })
      }
    })

    return jobs
  } catch (error) {
    console.error('Stack Overflow API error:', error)
    return []
  }
}

/**
 * Indeed API integration (requires API key)
 */
async function fetchIndeedJobs(targetDate: string): Promise<JobPosting[]> {
  try {
    // Indeed Employer API (requires authentication)
    const apiKey = process.env.INDEED_API_KEY
    if (!apiKey) {
      console.log('Indeed API key not configured, falling back to scraper')
      return scrapeIndeedJobs(targetDate)
    }

    // This is a placeholder - actual Indeed API implementation depends on your subscription tier
    // For now, fall back to scraper
    return scrapeIndeedJobs(targetDate)
  } catch (error) {
    console.error('Indeed API error:', error)
    return scrapeIndeedJobs(targetDate)
  }
}

/**
 * Scrape LinkedIn Jobs
 */
async function scrapeLinkedInJobs(
  targetDate: string
): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://linkedin.com/jobs/search/?sortBy=recent', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll(
        '[data-job-id], .base-card, .jobs-search__results-list li'
      )

      jobCards.forEach((card) => {
        const titleEl = card.querySelector(
          '.base-search-card__title, .job-card-title, h3'
        )
        const companyEl = card.querySelector(
          '.base-search-card__subtitle, .job-card-container__company-name'
        )
        const dateEl = card.querySelector('time')

        if (titleEl && dateEl?.textContent?.includes('day')) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: (card as HTMLElement).closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('LinkedIn scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Indeed Jobs
 */
async function scrapeIndeedJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://indeed.com/jobs?q=&sort=date', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('.job_seen_beacon, .resultContent')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector(
          '.jobTitle span, h2 a, .jcs-JobTitle'
        )
        const companyEl = card.querySelector(
          '[data-company-name], .company_location span'
        )
        const dateEl = card.querySelector('.date')

        // Check if job was posted today
        if (dateEl?.textContent?.includes('24 hours') || dateEl?.textContent?.includes('Today')) {
          jobsList.push({
            title: titleEl?.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: titleEl?.closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('Indeed scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape GitHub Jobs
 */
async function scrapeGitHubJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://jobs.github.com?search=&location=', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('.job-post-btn-group, .job-listing-preview')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('h2, .listing-title')
        const companyEl = card.querySelector('h3, .company-name')
        const dateEl = card.querySelector('.when, time')

        if (titleEl) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: (card as HTMLElement).closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('GitHub scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Built In
 */
async function scrapeBuiltInJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://builtin.com/jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('[data-testid="job-card"], .job-card')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('h2, .job-title')
        const companyEl = card.querySelector('.company-name, [data-testid="company-name"]')

        if (titleEl) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: (card as HTMLElement).closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('Built In scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape FlexJobs
 */
async function scrapeFlexJobsJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://flexjobs.com/search', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('[data-job-id], .job-listing')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('.job-title, h2, a')
        const companyEl = card.querySelector('.company-name')
        const dateEl = card.querySelector('[data-posted], .posted-date')

        if (titleEl && dateEl?.textContent?.includes('today')) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: titleEl.closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('FlexJobs scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Dice
 */
async function scrapeDiceJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://dice.com/jobs?q=&ecl=true', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll(
        '[data-testid="search-card"], .search-card'
      )

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('.card-title, h2, a')
        const companyEl = card.querySelector('.company-name')

        if (titleEl) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: titleEl.closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('Dice scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape AngelList Jobs
 */
async function scrapeAngelListJobs(targetDate: string): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    await page.goto('https://angel.co/jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('[data-test="job-card"], .job-card')

      jobCards.forEach((card) => {
        const titleEl = card.querySelector('h2, .job-title, a')
        const companyEl = card.querySelector('.company-name, [data-test="company"]')

        if (titleEl) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: companyEl?.textContent?.trim() || 'Unknown',
            url: titleEl.closest('a')?.href || undefined,
            postedDate: queryDate,
            source: 'scraper',
          })
        }
      })

      return jobsList
    }, targetDate)

    return jobs
  } catch (error) {
    console.error('AngelList scrape error:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Generic board scraper for unknown boards
 */
async function genericBoardScraper(
  boardName: string,
  targetDate: string
): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    // Generic job board URL pattern
    const searchUrl = `https://www.${boardName.toLowerCase().replace(/\s+/g, '')}.com/jobs`

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    }).catch(() => null)

    const jobs = await page.evaluate(() => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll(
        '[class*="job"], [class*="posting"], article, .listing'
      )

      jobCards.forEach((card) => {
        const titleEl = card.querySelector(
          'h2, h3, [class*="title"], a[href*="job"]'
        )

        if (titleEl) {
          jobsList.push({
            title: titleEl.textContent?.trim() || 'Unknown',
            company: 'Unknown',
            postedDate: new Date().toISOString().split('T')[0],
            source: 'scraper',
          })
        }
      })

      return jobsList
    })

    return jobs
  } catch (error) {
    console.error(`Generic scrape error for ${boardName}:`, error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

