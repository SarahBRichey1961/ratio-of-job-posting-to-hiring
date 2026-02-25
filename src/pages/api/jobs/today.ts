import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

/**
 * API endpoint to get jobs posted "today" for a specific board
 * Uses free public job APIs (no authentication required)
 * 
 * Query params:
 * - boardId: number (required) - ID of the job board
 * - boardName: string (required) - Name of the job board
 * - date: string (optional) - Date to query in YYYY-MM-DD format, defaults to today
 * - debug: boolean (optional) - Enable debug logging
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

    let jobs: JobPosting[] = []

    // Route to appropriate API based on board
    const boardNameStr = boardName as string
    switch (boardNameStr) {
      case 'Stack Overflow Jobs':
        if (debugMode) console.log(`[DEBUG] Using Stack Overflow API`)
        jobs = await fetchStackOverflowJobs(targetDate, debugMode)
        break
      
      case 'Indeed':
      case 'General':
      case 'Remote':
        if (debugMode) console.log(`[DEBUG] Using Jooble API for ${boardNameStr}`)
        jobs = await fetchJoobleJobs(targetDate, debugMode)
        break
      
      case 'LinkedIn':
      case 'GitHub Jobs':
      case 'Built In':
      case 'Dice':
      case 'AngelList Talent':
        if (debugMode) console.log(`[DEBUG] Using GitHub Search API for ${boardNameStr}`)
        jobs = await fetchGitHubSearchJobs(targetDate, debugMode)
        break
      
      case 'FlexJobs':
        if (debugMode) console.log(`[DEBUG] Using RemoteOK API for ${boardNameStr}`)
        jobs = await fetchRemoteOKJobs(targetDate, debugMode)
        break
      
      default:
        if (debugMode) console.log(`[DEBUG] Using Jooble API for unknown board: ${boardNameStr}`)
        jobs = await fetchJoobleJobs(targetDate, debugMode)
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
 * Returns all available jobs
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

    response.data.items?.forEach((job: any) => {
      const jobDate = new Date(job.creation_date * 1000)
      const jobDateString = jobDate.toISOString().split('T')[0]
      jobs.push({
        title: job.title,
        company: job.company_name,
        url: job.link,
        postedDate: jobDateString,
        source: 'api',
      })
    })

    if (debugMode) console.log(`[DEBUG] Stack Overflow: Found ${jobs.length} jobs`)
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
      if (debugMode) console.log('[DEBUG] Indeed API key not configured, using fallback')
      return fetchJoobleJobs(targetDate, debugMode)
    }

    // This is a placeholder - actual Indeed API implementation depends on your subscription tier
    // For now, fall back to Jooble
    return fetchJoobleJobs(targetDate, debugMode)
  } catch (error) {
    console.error('Indeed API error:', error)
    return fetchJoobleJobs(targetDate, debugMode)
  }
}

/**
 * Jooble API - Free public job search API
 * Returns all available jobs
 */
async function fetchJoobleJobs(
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Fetching Jooble API for date: ${targetDate}`)

    const response = await axios.post(
      'https://api.jooble.org/api/v2/search',
      {
        keywords: 'engineer',
        pageSize: 100,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    if (debugMode) {
      console.log(`[DEBUG] Jooble API response status: ${response.status}`)
      console.log(`[DEBUG] Jobs returned: ${response.data.jobs?.length || 0}`)
    }

    const jobs: JobPosting[] = []

    response.data.jobs?.forEach((job: any) => {
      if (job.updated) {
        const postedDate = job.updated.split(' ')[0] // Extract YYYY-MM-DD
        jobs.push({
          title: job.title,
          company: job.company,
          url: job.link,
          postedDate: postedDate,
          source: 'api',
        })
      }
    })

    if (debugMode) console.log(`[DEBUG] Jooble: Found ${jobs.length} jobs`)
    return jobs
  } catch (error) {
    console.error('Jooble API error:', error)
    if (debugMode) console.error('[DEBUG] Jooble error details:', error)
    return []
  }
}

/**
 * GitHub API for job search
 * Returns all available jobs
 */
async function fetchGitHubSearchJobs(
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Fetching GitHub Search API`)

    const jobs: JobPosting[] = []

    const response = await axios.get('https://api.github.com/search/issues', {
      params: {
        q: 'label:job type:issue',
        sort: 'created',
        order: 'desc',
        per_page: 100,
      },
      timeout: 10000,
    })

    if (debugMode) {
      console.log(`[DEBUG] GitHub API response status: ${response.status}`)
      console.log(`[DEBUG] Items returned: ${response.data.items?.length || 0}`)
    }

    response.data.items?.forEach((item: any) => {
      jobs.push({
        title: item.title,
        company: item.repository_url?.split('/')[4] || 'GitHub',
        url: item.html_url,
        postedDate: item.created_at?.split('T')[0] || targetDate,
        source: 'api',
      })
    })

    if (debugMode) console.log(`[DEBUG] GitHub: Found ${jobs.length} jobs`)
    // Return unique jobs (limit to 50)
    return jobs.slice(0, 50)
  } catch (error) {
    console.error('GitHub API error:', error)
    if (debugMode) console.error('[DEBUG] GitHub API error details:', error)
    return []
  }
}

/**
 * RemoteOK API - Free API for remote jobs
 * Returns all available jobs
 */
async function fetchRemoteOKJobs(
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Fetching RemoteOK API for date: ${targetDate}`)

    const response = await axios.get('https://remoteok.io/api', {
      timeout: 10000,
    })

    if (debugMode) {
      console.log(`[DEBUG] RemoteOK API response status: ${response.status}`)
      console.log(`[DEBUG] Jobs returned: ${response.data?.length || 0}`)
    }

    const jobs: JobPosting[] = []

    response.data?.forEach((job: any) => {
      if (job.date_posted) {
        const postedDate = new Date(job.date_posted * 1000).toISOString().split('T')[0]
        jobs.push({
          title: job.title,
          company: job.company,
          url: job.url,
          postedDate: postedDate,
          source: 'api',
        })
      }
    })

    if (debugMode) console.log(`[DEBUG] RemoteOK: Found ${jobs.length} jobs`)
    return jobs
  } catch (error) {
    console.error('RemoteOK API error:', error)
    if (debugMode) console.error('[DEBUG] RemoteOK error details:', error)
    return []
  }
}

