import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * JSearch API Provider (RapidAPI)
 * Aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter
 */
export class JSearchProvider extends BaseJobProvider {
  name = 'JSearch'
  priority = 50 // Higher priority (lower number)
  private apiKey: string
  private readonly ENDPOINT = 'https://jsearch.p.rapidapi.com/search'

  constructor() {
    super()
    this.apiKey = process.env.RAPIDAPI_KEY || ''
    this.enabled = this.isConfigured()
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
          error: 'JSearch API key not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching for: ${params.query}`)

      const queryParams = new URLSearchParams({
        query: params.query,
        num_pages: Math.min(params.limit || 10, 10).toString(),
      })

      if (params.location) {
        queryParams.append('location', params.location)
      }

      const response = await fetch(`${this.ENDPOINT}?${queryParams}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      })

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()
      this.log(`📊 JSearch returned ${data.data?.length || 0} results`)

      const jobs = (data.data || [])
        .filter((job: any) => {
          // Filter by job type if specified
          if (!params.jobType) return true
          const jobType = job.job_employment_type?.toLowerCase()
          return jobType === params.jobType
        })
        .map((job: any) => ({
          id: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          location: job.job_location,
          url: job.job_apply_link,
          salary: job.job_salary_currency
            ? `${job.job_salary_currency}${job.job_salary_max ? `-${job.job_salary_max}` : job.job_salary_min || ''}`
            : undefined,
          postedDate: job.job_posted_at_datetime_utc,
          description: job.job_description,
          jobType: job.job_employment_type?.toLowerCase(),
          source: this.name,
        }))

      this.log(`✅ Filtered to ${jobs.length} jobs`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.data?.length || 0,
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
