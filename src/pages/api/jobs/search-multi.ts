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
 *
 * Example:
 * GET /api/jobs/search-multi?query=Engineer&jobType=remote&limit=50
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query, jobType, location, limit = 25, providers: providerParam } =
      req.query

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
    const result = await orchestrator.search({
      query,
      jobType: jobTypeValue(),
      location: location ? String(location) : undefined,
      limit: Math.min(parseInt(String(limit)) || 25, 100),
    })

    return res.status(200).json({
      success: true,
      ...result,
      configuration: orchestrator.getConfiguration(),
    })
  } catch (error) {
    console.error('❌ Search error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
