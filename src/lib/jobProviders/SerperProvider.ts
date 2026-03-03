import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * Serper.dev Job Search API Provider
 * Advanced web search API with job-specific results
 * Free tier available at https://serper.dev
 * Better than Adzuna/JSearch for finding diverse job listings
 */
export class SerperProvider extends BaseJobProvider {
  name = 'Serper'
  priority = 25 // High priority - best results
  private apiKey: string
  private readonly ENDPOINT = 'https://google.serper.dev/search'

  constructor() {
    super()
    this.apiKey = process.env.SERPER_API_KEY || ''
    this.enabled = this.isConfigured()

    if (!this.enabled) {
      this.log('⚠️ Serper API key not configured. Set SERPER_API_KEY environment variable.')
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  async search(params: JobSearchParams): Promise<JobProviderResponse> {
    try {
      if (!this.validateParams(params)) {
        return {
          success: false,
          jobs: [],
          error: 'Invalid search parameters',
          provider: this.name,
        }
      }

      if (!this.isConfigured()) {
        return {
          success: false,
          jobs: [],
          error: 'Serper API key not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching Serper for: ${params.query}`)

      // Build search query with location and job type
      let searchQuery = `${params.query} jobs`

      // Add location to search
      if (params.location && params.location.toLowerCase() !== 'us') {
        searchQuery += ` in ${params.location}`
      } else {
        searchQuery += ' in United States' // Ensure US focus
      }

      // Add job type preference
      if (params.jobType === 'remote') {
        searchQuery += ' remote'
      } else if (params.jobType === 'hybrid') {
        searchQuery += ' hybrid'
      } else if (params.jobType === 'onsite') {
        searchQuery += ' on-site'
      }

      const payload = {
        q: searchQuery,
        type: 'jobs',
        gl: 'us',
        hl: 'en',
        num: Math.min(params.limit || 30, 100),
      }

      const response = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Serper API error ${response.status}: ${error.substring(0, 200)}`)
      }

      const data = await response.json()

      if (!data.jobs || data.jobs.length === 0) {
        this.log(`📊 No Serper results found for: ${searchQuery}`)
        return {
          success: true,
          jobs: [],
          provider: this.name,
          totalCount: 0,
        }
      }

      this.log(`✅ Found ${data.jobs.length} jobs from Serper`)

      // Map Serper job format to our standard format
      const jobs = (data.jobs || [])
        .map((job: any) => {
          try {
            // Serper returns jobs with title, company, location, link
            return {
              id: job.link || `serper-${job.title}-${Date.now()}`,
              title: job.title || 'Untitled Position',
              company: job.company || 'Unknown Company',
              location: job.location || 'Remote',
              url: job.link || '',
              description: job.snippet || '',
              postedDate: new Date().toISOString(), // Serper doesn't provide date, use now
              jobType: this.extractJobType(job),
              source: this.name,
            }
          } catch (mapError) {
            this.logError('Error mapping Serper job', mapError)
            return null
          }
        })
        .filter((job) => job !== null) as any[]

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.searchParameters?.page ? jobs.length : data.jobs.length,
      }
    } catch (error) {
      this.logError('Serper search failed', error)
      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      }
    }
  }

  private extractJobType(
    job: any
  ): 'remote' | 'hybrid' | 'onsite' | undefined {
    const text = `${job.title || ''} ${job.snippet || ''}`.toLowerCase()

    if (text.includes('remote')) {
      return 'remote'
    }
    if (text.includes('hybrid')) {
      return 'hybrid'
    }
    if (
      text.includes('on-site') ||
      text.includes('on site') ||
      text.includes('onsite')
    ) {
      return 'onsite'
    }

    return undefined
  }
}
