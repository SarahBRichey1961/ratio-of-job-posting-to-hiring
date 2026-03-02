import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

/**
 * API endpoint to search for jobs by title posted today
 * Uses JSearch API to search across multiple job sources
 * 
 * Query params:
 * - title: string (required) - Job title to search for (e.g., "Senior Technical Program Manager")
 * - date: string (optional) - Date to query in YYYY-MM-DD format, defaults to today
 * - limit: number (optional) - Number of results to return, defaults to 50
 * 
 * Environment variables:
 * - RAPIDAPI_KEY: RapidAPI key for JSearch API access
 */

interface JobPosting {
  id: string
  title: string
  company?: string
  location?: string
  url?: string
  salary?: string
  postedDate: string
  description?: string
  source: 'api'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, date, limit = '50' } = req.query
    const targetDate = (date as string) || new Date().toISOString().split('T')[0]
    const resultLimit = Math.min(parseInt(limit as string), 100)

    if (!title) {
      return res.status(400).json({
        error: 'Missing required parameter: title',
      })
    }

    const jobs = await fetchJobsByTitle(title as string, targetDate, resultLimit)

    const response = {
      success: true,
      title: title,
      date: targetDate,
      jobCount: jobs.length,
      jobs: jobs,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error searching jobs:', error)
    return res.status(500).json({
      error: `Failed to search jobs for title: ${req.query.title}`,
      details: String(error),
    })
  }
}

/**
 * Search for jobs by title using JSearch API
 */
async function fetchJobsByTitle(
  jobTitle: string,
  targetDate: string,
  limit: number = 50
): Promise<JobPosting[]> {
  try {
    const apiKey = process.env.RAPIDAPI_KEY
    if (!apiKey) {
      console.error('RAPIDAPI_KEY environment variable not set')
      return []
    }

    // Use the job title directly as the search query
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: jobTitle,
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

    const jobs: JobPosting[] = []

    // Map JSearch response to JobPosting format
    response.data?.data?.forEach((job: any, index: number) => {
      const postedDate = job.job_posted_at_timestamp
        ? new Date(job.job_posted_at_timestamp * 1000).toISOString().split('T')[0]
        : targetDate

      jobs.push({
        id: `${job.job_id || index}`,
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : job.job_country,
        url: job.job_apply_link,
        salary: job.job_salary_currency && job.job_min_salary 
          ? `${job.job_salary_currency} ${job.job_min_salary}-${job.job_max_salary}`
          : undefined,
        postedDate: postedDate,
        description: job.job_description?.substring(0, 200),
        source: 'api',
      })
    })

    console.log(`Job search for "${jobTitle}": Found ${jobs.length} jobs`)
    return jobs.slice(0, limit)
  } catch (error) {
    console.error('JSearch API error:', error)
    if (axios.isAxiosError(error)) {
      console.error('JSearch error response:', error.response?.data)
    }
    return []
  }
}
