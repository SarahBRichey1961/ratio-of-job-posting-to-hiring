import { NextApiRequest, NextApiResponse } from 'next'
import puppeteer, { Browser } from 'puppeteer'

/**
 * API endpoint to get jobs posted "today" (first day posting only) for a specific board
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

    // Get jobs posted on the specific date for the board
    const jobs = await scrapeBoardForDate(
      parseInt(boardId as string),
      boardName as string,
      targetDate
    )

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
 * Scrape a job board for jobs posted on a specific date
 * Returns array of job postings with basic info
 */
async function scrapeBoardForDate(
  boardId: number,
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

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )

    // Navigate based on board
    let jobUrl = ''
    switch (boardName) {
      case 'LinkedIn':
        jobUrl = `https://linkedin.com/jobs/search/?keywords=&sortBy=recent`
        break
      case 'Indeed':
        jobUrl = `https://indeed.com/jobs`
        break
      case 'Stack Overflow Jobs':
        jobUrl = `https://stackoverflow.com/jobs?sort=i`
        break
      case 'GitHub Jobs':
        jobUrl = `https://jobs.github.com`
        break
      case 'Built In':
        jobUrl = `https://builtin.com/jobs`
        break
      case 'AngelList Talent':
        jobUrl = `https://angel.co/jobs`
        break
      case 'Dice':
        jobUrl = `https://dice.com/jobs?q=&ecl=true`
        break
      case 'FlexJobs':
        jobUrl = `https://flexjobs.com/search?search_keywords=&sort=date_posted`
        break
      default:
        return []
    }

    // Set timeout
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)

    // Go to the board
    await page.goto(jobUrl, { waitUntil: 'networkidle2' })

    // Extract jobs (basic extraction - varies by board structure)
    const jobs = await page.evaluate((queryDate: string) => {
      const jobsList: JobPosting[] = []
      const todayPostings = document.querySelectorAll(
        '[data-posted], .posted-date, time, .job-date'
      )

      // This is a basic extraction - real implementation would be board-specific
      todayPostings.forEach((el) => {
        const title = el.closest('[data-job-title], .job-title, .jobsearch-ResultsList_item_jobTitle')
        const dateAttr = el.getAttribute('datetime') || el.textContent || ''

        if (
          title &&
          (dateAttr.includes(queryDate) || dateAttr.includes('today'))
        ) {
          jobsList.push({
            title: title.textContent || 'Unknown',
            url: title.getAttribute('href') || undefined,
            postedDate: queryDate,
          })
        }
      })

      return jobsList
    }, targetDate)

    await page.close()

    return jobs
  } catch (error) {
    console.error(`Failed to scrape ${boardName}:`, error)
    return []
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
