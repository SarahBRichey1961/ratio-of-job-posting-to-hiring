import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * LinkedIn API Provider
 * Requires LinkedIn Enterprise API credentials
 * Docs: https://docs.microsoft.com/en-us/linkedin/
 *
 * NOTE: LinkedIn API is enterprise-only ($5k-30k/year)
 * Consider alternatives first (Indeed, JSearch, Stack Overflow)
 * This is kept for future integration potential
 */
export class LinkedInProvider extends BaseJobProvider {
  name = 'LinkedIn'
  priority = 60 // Lower priority - API is expensive and restrictive
  private accessToken: string
  private readonly ENDPOINT = 'https://api.linkedin.com/v2'

  constructor() {
    super()
    this.accessToken = process.env.LINKEDIN_API_TOKEN || ''
    this.enabled = this.isConfigured()
    if (!this.enabled) {
      this.log(
        '⚠️ LinkedIn API not configured. Sign up at https://business.linkedin.com/talent-solutions'
      )
    }
  }

  isConfigured(): boolean {
    return !!this.accessToken && this.accessToken.length > 0
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
          error: 'LinkedIn API token not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching LinkedIn for: ${params.query}`)

      // LinkedIn Talent Solutions API endpoint
      const endpoint = `${this.ENDPOINT}/jobSearch`

      const queryParams = new URLSearchParams({
        keywords: params.query,
        limit: Math.min(params.limit || 10, 100).toString(),
      })

      if (params.location) {
        queryParams.append('location', params.location)
      }

      const response = await fetch(`${endpoint}?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        throw new Error('LinkedIn API token expired or invalid')
      }

      if (!response.ok) {
        throw new Error(`LinkedIn API returned status ${response.status}`)
      }

      const data = await response.json()

      const jobs = (data.elements || [])
        .filter((job: any) => {
          if (!params.jobType) return true
          const type = job.jobFunction?.toLowerCase()
          return type?.includes(params.jobType)
        })
        .map((job: any) => ({
          id: job.id,
          title: job.title,
          company: job.company?.name,
          location: job.location?.country,
          url: job.jobPostingUrl,
          salary: undefined, // LinkedIn typically doesn't include salary in API
          postedDate: new Date(job.listedDate).toISOString(),
          description: job.description,
          jobType: this.extractJobType(job),
          source: this.name,
        }))

      this.log(`✅ Found ${jobs.length} positions on LinkedIn`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.paging?.total || 0,
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

  private extractJobType(
    job: any
  ): 'remote' | 'hybrid' | 'onsite' | undefined {
    const workplaceType = job.workplaceType?.toLowerCase()
    if (workplaceType?.includes('remote')) return 'remote'
    if (workplaceType?.includes('hybrid')) return 'hybrid'
    if (workplaceType?.includes('on-site') || workplaceType?.includes('onsite'))
      return 'onsite'
    return undefined
  }
}
