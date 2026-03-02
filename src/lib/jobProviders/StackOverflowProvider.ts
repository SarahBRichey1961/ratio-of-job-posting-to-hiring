import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * Stack Overflow Jobs API Provider
 * Free API for job listings
 * Docs: https://stackoverflow.com/jobs/api
 */
export class StackOverflowProvider extends BaseJobProvider {
  name = 'Stack Overflow'
  priority = 45 // High priority - free and good quality
  private readonly ENDPOINT = 'https://stackoverflow.com/jobs/api'

  constructor() {
    super()
    this.enabled = true // No API key required for basic searches
  }

  isConfigured(): boolean {
    return true // No configuration needed
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

      this.log(`🔍 Searching Stack Overflow for: ${params.query}`)

      const queryParams = new URLSearchParams({
        q: params.query,
      })

      if (params.location) {
        queryParams.append('l', params.location)
      }

      if (params.jobType === 'remote') {
        queryParams.append('r', 't') // Remote jobs
      }

      const response = await fetch(`${this.ENDPOINT}/jobsearch?${queryParams}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(
          `Stack Overflow API returned status ${response.status}`
        )
      }

      const data = await response.json()

      const jobs = (data || [])
        .filter((job: any) => {
          if (!params.jobType) return true
          if (params.jobType === 'remote') {
            return job.is_remote
          }
          // Stack Overflow doesn't have hybrid/onsite filtering via API
          return true
        })
        .slice(0, params.limit || 10)
        .map((job: any) => ({
          id: job.job_id?.toString() || `so-${job.title}-${Date.now()}`,
          title: job.title,
          company: job.company_name,
          location: job.location,
          url: job.apply_url,
          salary: undefined, // Stack Overflow doesn't include salary in API
          postedDate: new Date(job.post_date * 1000).toISOString(),
          description: job.job_description,
          jobType: job.is_remote ? 'remote' : undefined,
          source: this.name,
        }))

      this.log(`✅ Found ${jobs.length} positions on Stack Overflow`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.length || 0,
      }
    } catch (error) {
      this.logError('Search failed', error)
      return {
        success: false,
        jobs: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
      }
    }
  }
}
