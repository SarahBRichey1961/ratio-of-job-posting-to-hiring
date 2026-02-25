import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

/**
 * API endpoint to get jobs posted "today" for a specific board
 * Uses JSearch API by OpenWeb Ninja (Real-time job aggregator)
 * Pulls from LinkedIn, Indeed, Glassdoor, ZipRecruiter, and all public job sites
 * 
 * Query params:
 * - boardId: number (required) - ID of the job board
 * - boardName: string (required) - Name of the job board
 * - date: string (optional) - Date to query in YYYY-MM-DD format, defaults to today
 * - debug: boolean (optional) - Enable debug logging
 * 
 * Environment variables:
 * - RAPIDAPI_KEY: RapidAPI key for JSearch API access
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

    // All job boards use JSearch API for comprehensive real-time data
    if (debugMode) console.log(`[DEBUG] Using JSearch API for all boards`)
    jobs = await fetchJSearchJobs(boardName as string, targetDate, debugMode)

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
 * JSearch API - Real-time job aggregator from OpenWeb Ninja
 * Sources: LinkedIn, Indeed, Glassdoor, ZipRecruiter, and all public job sites
 */
async function fetchJSearchJobs(
  boardName: string,
  targetDate: string,
  debugMode: boolean = false
): Promise<JobPosting[]> {
  try {
    if (debugMode) console.log(`[DEBUG] Fetching JSearch API for date: ${targetDate}`)

    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      console.error('RAPIDAPI_KEY environment variable not set')
      if (debugMode) console.error('[DEBUG] Missing RAPIDAPI_KEY - cannot call JSearch API')
      return []
    }

    // Build search query based on board name
    let query = ''
    switch (boardName) {
      case 'LinkedIn':
        query = 'software engineer'
        break
      case 'Indeed':
        query = 'jobs'
        break
      case 'Stack Overflow Jobs':
        query = 'developer'
        break
      case 'GitHub Jobs':
        query = 'developer'
        break
      case 'FlexJobs':
        query = 'remote'
        break
      case 'General':
        query = 'jobs'
        break
      case 'Remote':
        query = 'remote'
        break
      default:
        query = 'jobs'
    }

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: query,
        page: 1,
        num_pages: 1,
        date_posted: targetDate,
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      timeout: 15000,
    })

    if (debugMode) {
      console.log(`[DEBUG] JSearch API response status: ${response.status}`)
      console.log(`[DEBUG] Jobs returned: ${response.data?.data?.length || 0}`)
    }

    const jobs: JobPosting[] = []

    // Map JSearch response to JobPosting format
    response.data?.data?.forEach((job: any) => {
      const postedDate = job.job_posted_at_timestamp
        ? new Date(job.job_posted_at_timestamp * 1000).toISOString().split('T')[0]
        : targetDate

      jobs.push({
        title: job.job_title,
        company: job.employer_name,
        url: job.job_apply_link,
        postedDate: postedDate,
        source: 'api',
      })
    })

    if (debugMode) console.log(`[DEBUG] JSearch: Found ${jobs.length} jobs`)
    return jobs
  } catch (error) {
    console.error('JSearch API error:', error)
    if (debugMode) {
      if (axios.isAxiosError(error)) {
        console.error('[DEBUG] JSearch error response:', error.response?.data)
      }
      console.error('[DEBUG] JSearch error details:', error)
    }
    return []
  }
}

