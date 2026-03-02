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

interface JobSearchResult {
  jobs: JobPosting[]
  rawResponse?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('📥 API /api/jobs/search called with method:', req.method)
  console.log('📥 Query params:', req.query)
  
  if (req.method !== 'GET') {
    console.warn('⚠️ Method not allowed:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { title, date, limit = '50', type = '' } = req.query
    const targetDate = (date as string) || new Date().toISOString().split('T')[0]
    const resultLimit = Math.min(parseInt(limit as string), 100)
    const jobType = (type as string) || ''

    console.log('🔍 Searching for:', { title, targetDate, resultLimit, jobType })

    if (!title) {
      console.error('❌ Missing title parameter')
      return res.status(400).json({
        error: 'Missing required parameter: title',
      })
    }

    console.log('🚀 Calling fetchJobsByTitle with:', title, 'type:', jobType)
    const result = await fetchJobsByTitle(title as string, targetDate, resultLimit, jobType)
    console.log(`✅ fetchJobsByTitle returned ${result.jobs.length} jobs`)

    const apiResponse = {
      success: true,
      title: title,
      date: targetDate,
      jobCount: result.jobs.length,
      jobs: result.jobs,
      debug: {
        rawJobsCount: result.rawResponse?.data?.length || 0,
        responseKeys: result.rawResponse ? Object.keys(result.rawResponse) : [],
        responsePreview: result.rawResponse ? JSON.stringify(result.rawResponse).substring(0, 500) : 'No response',
      }
    }

    console.log('📤 Sending response with', result.jobs.length, 'jobs')
    return res.status(200).json(apiResponse)
  } catch (error) {
    console.error('💥 Handler error:', error)
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
  limit: number = 50,
  jobType: string = ''
): Promise<JobSearchResult> {
  try {
    const apiKey = process.env.RAPIDAPI_KEY
    console.log('🔐 RAPIDAPI_KEY present:', !!apiKey)
    console.log('🔐 RAPIDAPI_KEY value (first 10 chars):', apiKey?.substring(0, 10))
    
    if (!apiKey) {
      console.error('❌ RAPIDAPI_KEY environment variable not set')
      return { jobs: [] }
    }

    // Use the job title directly as the search query
    const url = 'https://jsearch.p.rapidapi.com/search'
    const params = {
      query: jobTitle,
      page: 1,
      num_pages: 1,
    }
    
    console.log('🌐 Calling JSearch API with params:', JSON.stringify(params))
    console.log('🌐 API URL:', url)
    console.log('🌐 Using RapidAPI Key:', apiKey.substring(0, 10) + '...')
    
    const axiosResponse = await axios.get(url, {
      params,
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      timeout: 15000,
    })

    console.log('📊 JSearch API status:', axiosResponse.status)
    console.log('📊 JSearch API full response:', JSON.stringify(axiosResponse.data, null, 2))
    console.log('📊 Response data keys:', Object.keys(axiosResponse.data || {}))
    console.log('📊 Response data.data type:', typeof axiosResponse.data?.data)
    console.log('📊 Response data.data length:', axiosResponse.data?.data?.length)
    
    const jobs: JobPosting[] = []

    // Check if response has data
    if (!axiosResponse.data?.data) {
      console.warn('⚠️ JSearch response has no data.data property')
      console.warn('⚠️ Full response object:', axiosResponse.data)
      return { jobs: [], rawResponse: axiosResponse.data }
    }

    // Map JSearch response to JobPosting format
    axiosResponse.data.data.forEach((job: any, index: number) => {
      console.log(`📍 Processing job ${index}:`, job.job_title, '-', job.employer_name)
      
      // Extract employment type from JSearch response
      // JSearch returns values like 'REMOTE', 'HYBRID', 'ONSITE'
      const employmentType = job.job_employment_type ? job.job_employment_type.toLowerCase() : ''
      console.log(`📍 Employment type for job ${index}: ${employmentType}`)
      
      // Filter by job type if specified
      if (jobType && employmentType !== jobType) {
        console.log(`⏭️ Skipping job ${index} - type ${employmentType} doesn't match filter ${jobType}`)
        return
      }
      
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

    console.log(`✅ Successfully mapped ${jobs.length} jobs from JSearch response (after filtering by type: ${jobType || 'all'})`)
    return { jobs: jobs.slice(0, limit), rawResponse: axiosResponse.data }
  } catch (error) {
    console.error('💥 fetchJobsByTitle error:', error)
    if (axios.isAxiosError(error)) {
      console.error('❌ Axios error response data:', JSON.stringify(error.response?.data, null, 2))
      console.error('❌ Axios error status:', error.response?.status)
      console.error('❌ Axios error headers:', error.response?.headers)
      console.error('❌ Axios error message:', error.message)
    }
    return { jobs: [] }
  }
}
