import { NextApiRequest, NextApiResponse } from 'next'
import {
  AdzunaProvider,
  JSearchProvider,
  IndeedProvider,
  LinkedInProvider,
  StackOverflowProvider,
  JobSearchOrchestrator,
} from '@/lib/jobProviders'

/**
 * Multi-Provider Job Search API
 * Searches across all configured job APIs simultaneously
 *
 * Query Parameters:
 * - query: (required) Job title or keyword
 * - jobType: (optional) 'remote' | 'hybrid' | 'onsite'
 * - location: (optional) Job location
 * - limit: (optional) Max results (default: 25)
 * - providers: (optional) Comma-separated list of providers to use
 * - hoursBack: (optional) Filter to jobs posted within last N hours (default: 0 = all)
 * - industry: (optional) Industry filter
 *
 * Example:
 * GET /api/jobs/search-multi?query=Engineer&jobType=remote&limit=50&hoursBack=72
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      query,
      jobType,
      location,
      limit = 25,
      providers: providerParam,
      hoursBack = 0,
      industry,
    } = req.query

    // Validate required parameters
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: query',
      })
    }

    const jobTypeValue = () => {
      if (jobType === 'remote' || jobType === 'hybrid' || jobType === 'onsite') {
        return jobType
      }
      return undefined
    }

    console.log(`\n🔍 Job Search API called`)
    console.log(`   Query: ${query}`)
    console.log(`   Type: ${jobTypeValue() || 'Any'}`)
    console.log(`   Location: ${location || 'Any'}`)
    console.log(
      `   Time Range: ${hoursBack ? `Last ${hoursBack} hours` : 'All time'}`
    )
    console.log(`   Env - ADZUNA_API_KEY: ${process.env.ADZUNA_API_KEY ? '✓' : '✗'}`)
    console.log(`   Env - ADZUNA_API_ID: ${process.env.ADZUNA_API_ID ? '✓' : '✗'}`)

    // Initialize all providers (Adzuna first now!)
    const allProviders = [
      new AdzunaProvider(),
      new JSearchProvider(),
      new StackOverflowProvider(),
      new IndeedProvider(),
      new LinkedInProvider(),
    ]

    // Filter providers if specified
    const activeProviders = providerParam
      ? allProviders.filter((p) => {
          const names = (providerParam as string)
            .split(',')
            .map((n) => n.trim().toLowerCase())
          return names.includes(p.name.toLowerCase())
        })
      : allProviders

    console.log(
      `   Providers: ${activeProviders.map((p) => p.name).join(', ')}`
    )

    // Create orchestrator with selected providers
    const orchestrator = new JobSearchOrchestrator(activeProviders)

    // Execute search
    let result = await orchestrator.search({
      query,
      jobType: jobTypeValue(),
      location: location ? String(location) : undefined,
      limit: Math.min(parseInt(String(limit)) || 25, 100),
    })

    // Filter by date if specified
    if (hoursBack && parseInt(String(hoursBack)) > 0) {
      const hoursBackNum = parseInt(String(hoursBack))
      const now = new Date()
      const cutoffTime = new Date(now.getTime() - hoursBackNum * 60 * 60 * 1000)

      const filteredJobs = result.jobs.filter((job) => {
        const postedTime = new Date(job.postedDate)
        return postedTime >= cutoffTime
      })

      console.log(
        `   📅 Filtered ${result.jobs.length} jobs to ${filteredJobs.length} posted in last ${hoursBackNum}h`
      )

      result = {
        ...result,
        jobs: filteredJobs,
        totalJobs: filteredJobs.length,
      }
    }

    const response = {
      success: result.jobs.length > 0 || result.totalJobs > 0,
      ...result,
      configuration: orchestrator.getConfiguration(),
    }
    
    console.log(`   ✅ Final response - Success: ${response.success}, Jobs: ${response.jobs?.length || 0}`)

    return res.status(200).json(response)
  } catch (error) {
    console.error('❌ Search error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
