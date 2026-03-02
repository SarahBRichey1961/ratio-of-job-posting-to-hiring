import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * TEMPLATE: Job Provider Implementation
 *
 * Copy this file to create a new job provider.
 * Replace "TEMPLATE" with your provider name.
 * Implement the search() method to call your API.
 *
 * Example: GitHubJobs, AngelList, Dice, WeWorkRemotely, FlexJobs
 */

export class TemplateProvider extends BaseJobProvider {
  name = 'Template Provider'
  priority = 100 // 0-100, lower = higher priority
  private apiKey: string
  private readonly ENDPOINT = 'https://api.example.com/jobs'

  constructor() {
    super()

    // Load API key from environment
    this.apiKey = process.env.TEMPLATE_API_KEY || ''

    // Set enabled based on configuration
    this.enabled = this.isConfigured()

    if (!this.enabled) {
      this.log('⚠️ Not configured. Set TEMPLATE_API_KEY environment variable.')
    }
  }

  /**
   * Check if API credentials are configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0
  }

  /**
   * Search for jobs using this provider's API
   */
  async search(params: JobSearchParams): Promise<JobProviderResponse> {
    try {
      // Validate search parameters
      if (!this.validateParams(params)) {
        return {
          success: false,
          jobs: [],
          error: 'Invalid search parameters',
          provider: this.name,
        }
      }

      // Check if configured
      if (!this.isConfigured()) {
        this.log('⚠️ API key not configured, cannot search')
        return {
          success: false,
          jobs: [],
          error: 'API key not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching for: ${params.query}`)

      // Build query parameters
      const queryParams = new URLSearchParams({
        q: params.query,
        limit: (params.limit || 10).toString(),
      })

      if (params.location) {
        queryParams.append('location', params.location)
      }

      // Make API call
      const response = await fetch(`${this.ENDPOINT}?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      // Handle API errors
      if (!response.ok) {
        const error = await response.text()
        throw new Error(
          `API returned ${response.status}: ${error.substring(0, 200)}`
        )
      }

      const data = await response.json()

      // Parse API response and map to JobListing format
      const jobs = (data.results || data.jobs || [])
        // Filter by job type if specified
        .filter((job: any) => {
          if (!params.jobType) return true
          const jobType = this.extractJobType(job)
          return jobType === params.jobType
        })
        // Map to standard JobListing format
        .map((job: any) => ({
          id: job.id,
          title: job.title || job.job_title || job.position,
          company: job.company || job.organization,
          location: job.location || job.city,
          url: job.url || job.apply_url || job.link,
          salary: this.formatSalary(job),
          postedDate: new Date(
            job.posted_at || job.posted_date || job.created_at
          ).toISOString(),
          description: job.description || job.job_description,
          jobType: this.extractJobType(job),
          source: this.name,
        }))

      this.log(`✅ Found ${jobs.length} matching positions`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.total || data.count || jobs.length,
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

  /**
   * Extract job type from API response
   * Normalize to: 'remote' | 'hybrid' | 'onsite'
   */
  private extractJobType(job: any): 'remote' | 'hybrid' | 'onsite' | undefined {
    const type = job.type || job.work_type || job.employment_type || ''
    const lower = String(type).toLowerCase()

    if (lower.includes('remote')) return 'remote'
    if (lower.includes('hybrid')) return 'hybrid'
    if (lower.includes('on-site') || lower.includes('onsite')) return 'onsite'

    return undefined
  }

  /**
   * Format salary from API response
   * Normalize to readable format
   */
  private formatSalary(job: any): string | undefined {
    if (!job.salary && !job.salary_min && !job.salary_max) {
      return undefined
    }

    if (job.salary) {
      return String(job.salary)
    }

    const min = job.salary_min
    const max = job.salary_max
    const currency = job.salary_currency || 'USD'

    if (min && max) {
      return `${currency} ${min.toLocaleString()}-${max.toLocaleString()}`
    } else if (min) {
      return `From ${currency} ${min.toLocaleString()}`
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}`
    }

    return undefined
  }
}
