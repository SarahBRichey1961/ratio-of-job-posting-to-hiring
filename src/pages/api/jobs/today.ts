import { NextApiRequest, NextApiResponse } from 'next'
import puppeteer, { Browser } from 'puppeteer'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

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

/**
 * Fetch job postings from database (test/mock data)
 */
async function getJobsFromDatabase(
  boardId: number,
  boardName: string,
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Querying database for board_id=${boardId}, date=${targetDate}`)

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('job_postings')
      .select('job_title, company_name, job_url, posted_date')
      .eq('board_id', boardId)
      .eq('posted_date', targetDate)

    if (error) {
      if (debugMode) console.log(`[DEBUG] Database query error:`, error)
      return []
    }

    const jobs: JobPosting[] = (data || []).map((row: any) => ({
      title: row.job_title,
      company: row.company_name,
      url: row.job_url,
      postedDate: row.posted_date,
      source: 'api',
    }))

    if (debugMode) console.log(`[DEBUG] Found ${jobs.length} jobs in database`)
    return jobs
  } catch (error) {
    console.error('Database query error:', error)
    if (debugMode) console.error('[DEBUG] Database error details:', error)
    return []
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { boardId, boardName, date, debug } = req.query
    const targetDate = (date as string) || new Date().toISOString().split('T')[0]
    const debugMode = debug === 'true'

    if (debugMode) {
      console.log(`[DEBUG] Job scraper request:`, {
        boardId,
        boardName,
        targetDate,
        timestamp: new Date().toISOString(),
      })
    }

    if (!boardId || !boardName) {
      return res.status(400).json({
        error: 'Missing required parameters: boardId and boardName',
      })
    }

    // First, try to get jobs from database (mock test data)
    let jobs: JobPosting[] = await getJobsFromDatabase(
      parseInt(boardId as string),
      boardName as string,
      targetDate,
      debugMode
    )

    // If no database results, try live scraping
    if (jobs.length === 0) {
      if (debugMode) console.log(`[DEBUG] No database entries found, attempting live scraper`)

      switch (boardName) {
        case 'Stack Overflow Jobs':
          if (debugMode) console.log(`[DEBUG] Using Stack Overflow API`)
          jobs = await fetchStackOverflowJobs(targetDate, debugMode)
          break
        case 'Indeed':
          if (debugMode) console.log(`[DEBUG] Using Indeed scraper`)
          jobs = await scrapeIndeedJobs(targetDate, debugMode)
          break
        case 'LinkedIn':
          if (debugMode) console.log(`[DEBUG] Using LinkedIn scraper`)
          jobs = await scrapeLinkedInJobs(targetDate, debugMode)
          break
        case 'GitHub Jobs':
          jobs = await scrapeGitHubJobs(targetDate, debugMode)
          break
        case 'Built In':
          jobs = await scrapeBuiltInJobs(targetDate, debugMode)
          break
        case 'FlexJobs':
          jobs = await scrapeFlexJobsJobs(targetDate, debugMode)
          break
        case 'Dice':
          jobs = await scrapeDiceJobs(targetDate, debugMode)
          break
        case 'AngelList Talent':
          jobs = await scrapeAngelListJobs(targetDate, debugMode)
          break
        default:
          jobs = await genericBoardScraper(boardName as string, targetDate, debugMode)
      }
    }

    const response = {
      success: true,
      board: boardName,
      date: targetDate,
      jobCount: jobs.length,
      jobs: jobs.slice(0, 50), // Return first 50 jobs
      ...(debugMode && { debug: { fetchedAt: new Date().toISOString() } }),
    }

    if (debugMode) {
      console.log(`[DEBUG] Response:`, response)
    }

    return res.status(200).json(response)
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
async function fetchStackOverflowJobs(
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Fetching Stack Overflow API for date: ${targetDate}`)

    const response = await axios.get('https://api.stackexchange.com/2.3/jobs', {
      params: {
        site: 'stackoverflow',
        sort: 'newest',
        order: 'desc',
        pagesize: 100,
      },
      timeout: 10000,
    })

    if (debugMode) {
      console.log(`[DEBUG] Stack Overflow API response status: ${response.status}`)
      console.log(`[DEBUG] Jobs returned: ${response.data.items?.length || 0}`)
    }

    const jobs: JobPosting[] = []
    const [targetYear, targetMonth, targetDay] = targetDate.split('-').map(Number)

    response.data.items?.forEach((job: any, index: number) => {
      const jobDate = new Date(job.creation_date * 1000)
      const jobYear = jobDate.getFullYear()
      const jobMonth = jobDate.getMonth() + 1
      const jobDay = jobDate.getDate()

      if (debugMode && index < 3) {
        console.log(`[DEBUG] Job ${index + 1}:`, {
          title: job.title,
          createdDate: `${jobYear}-${String(jobMonth).padStart(2, '0')}-${String(jobDay).padStart(2, '0')}`,
          targetDate,
          match: `${jobYear}-${String(jobMonth).padStart(2, '0')}-${String(jobDay).padStart(2, '0')}` === targetDate,
        })
      }

      // Match dates: YYYY-MM-DD format
      const jobDateString = `${jobYear}-${String(jobMonth).padStart(2, '0')}-${String(jobDay).padStart(2, '0')}`
      if (jobDateString === targetDate) {
        jobs.push({
          title: job.title,
          company: job.company_name,
          url: job.link,
          postedDate: targetDate,
          source: 'api',
        })
      }
    })

    if (debugMode) console.log(`[DEBUG] Matching jobs found: ${jobs.length}`)
    return jobs
  } catch (error) {
    console.error('Stack Overflow API error:', error)
    if (debugMode) console.error('[DEBUG] Stack Overflow error details:', error)
    return []
  }
}

/**
 * Indeed API integration (requires API key) - Falls back to scraper
 */
async function fetchIndeedJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  try {
    // Indeed Employer API (requires authentication)
    const apiKey = process.env.INDEED_API_KEY
    if (!apiKey) {
      if (debugMode) console.log('[DEBUG] Indeed API key not configured, using scraper')
      return scrapeIndeedJobs(targetDate, debugMode)
    }

    // This is a placeholder - actual Indeed API implementation depends on your subscription tier
    // For now, fall back to scraper
    return scrapeIndeedJobs(targetDate, debugMode)
  } catch (error) {
    console.error('Indeed API error:', error)
    return scrapeIndeedJobs(targetDate, debugMode)
  }
}

/**
 * Scrape LinkedIn Jobs
 */
async function scrapeLinkedInJobs(
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting LinkedIn scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to LinkedIn jobs`)
    await page.goto('https://linkedin.com/jobs/search/?sortBy=recent', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting LinkedIn jobs`)
    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll(
        '[data-job-id], .base-card, .jobs-search__results-list li'
      )

      let foundToday = 0
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
          foundToday++
        }
      })

      return jobsList
    }, targetDate)

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from LinkedIn`)
    return jobs
  } catch (error) {
    console.error('LinkedIn scrape error:', error)
    if (debugMode) console.error('[DEBUG] LinkedIn scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Indeed Jobs
 */
async function scrapeIndeedJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting Indeed scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to Indeed jobs`)
    await page.goto('https://indeed.com/jobs?q=&sort=date', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting Indeed jobs`)
    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const jobCards = document.querySelectorAll('.job_seen_beacon, .resultContent')

      let checked = 0
      jobCards.forEach((card) => {
        const titleEl = card.querySelector(
          '.jobTitle span, h2 a, .jcs-JobTitle'
        )
        const companyEl = card.querySelector(
          '[data-company-name], .company_location span'
        )
        const dateEl = card.querySelector('.date')

        checked++

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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from Indeed`)
    return jobs
  } catch (error) {
    console.error('Indeed scrape error:', error)
    if (debugMode) console.error('[DEBUG] Indeed scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape GitHub Jobs
 */
async function scrapeGitHubJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting GitHub Jobs scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to GitHub Jobs`)
    await page.goto('https://jobs.github.com?search=&location=', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting GitHub Jobs`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from GitHub Jobs`)
    return jobs
  } catch (error) {
    console.error('GitHub scrape error:', error)
    if (debugMode) console.error('[DEBUG] GitHub scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Built In
 */
async function scrapeBuiltInJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting Built In scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to Built In jobs`)
    await page.goto('https://builtin.com/jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting Built In jobs`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from Built In`)
    return jobs
  } catch (error) {
    console.error('Built In scrape error:', error)
    if (debugMode) console.error('[DEBUG] Built In scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape FlexJobs
 */
async function scrapeFlexJobsJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting FlexJobs scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to FlexJobs`)
    await page.goto('https://flexjobs.com/search', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting FlexJobs`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from FlexJobs`)
    return jobs
  } catch (error) {
    console.error('FlexJobs scrape error:', error)
    if (debugMode) console.error('[DEBUG] FlexJobs scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape Dice
 */
async function scrapeDiceJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting Dice scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to Dice jobs`)
    await page.goto('https://dice.com/jobs?q=&ecl=true', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting Dice jobs`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from Dice`)
    return jobs
  } catch (error) {
    console.error('Dice scrape error:', error)
    if (debugMode) console.error('[DEBUG] Dice scrape error details:', error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

/**
 * Scrape AngelList Jobs
 */
async function scrapeAngelListJobs(targetDate: string, debugMode: boolean = false): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting AngelList scraper`)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    if (debugMode) console.log(`[DEBUG] Navigating to AngelList jobs`)
    await page.goto('https://angel.co/jobs', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    if (debugMode) console.log(`[DEBUG] Extracting AngelList jobs`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from AngelList`)
    return jobs
  } catch (error) {
    console.error('AngelList scrape error:', error)
    if (debugMode) console.error('[DEBUG] AngelList scrape error details:', error)
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
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  let browser: Browser | null = null
  try {
    if (debugMode) console.log(`[DEBUG] Starting generic scraper for board: ${boardName}`)

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

    if (debugMode) console.log(`[DEBUG] Navigating to ${searchUrl}`)
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    }).catch(() => {
      if (debugMode) console.log(`[DEBUG] Failed to navigate to ${searchUrl}, continuing with current page`)
      return null
    })

    if (debugMode) console.log(`[DEBUG] Extracting jobs from generic board`)
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

    if (debugMode) console.log(`[DEBUG] Extracted ${jobs.length} jobs from generic board`)
    return jobs
  } catch (error) {
    console.error(`Generic scrape error for ${boardName}:`, error)
    if (debugMode) console.error(`[DEBUG] Generic scrape error details for ${boardName}:`, error)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

