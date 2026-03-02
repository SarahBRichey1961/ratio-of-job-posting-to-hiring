import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * Indeed API Provider
 * Direct Indeed API integration (free tier available or premium)
 * Docs: https://opensource.indeedeng.io/
 */
export class IndeedProvider extends BaseJobProvider {
  name = 'Indeed'
  priority = 40 // Higher priority than JSearch - Indeed has good quality results
  private apiKey: string
  private readonly ENDPOINT = 'https://api.indeed.com/graphql'

  constructor() {
    super()
    this.apiKey = process.env.INDEED_API_KEY || ''
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
        this.log('⚠️ Indeed API key not configured, skipping')
        return {
          success: false,
          jobs: [],
          error: 'Indeed API key not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching for: ${params.query}`)

      // GraphQL query for Indeed API
      const query = `
        query searchJobs($query: String!, $location: String, $limit: Int) {
          jobSearch(query: $query, location: $location, limit: $limit) {
            jobs {
              key
              title
              company
              location
              url
              salary
              postedDate
              description
              jobType
            }
            totalCount
          }
        }
      `

      const response = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            query: params.query,
            location: params.location,
            limit: params.limit || 10,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()

      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL error')
      }

      const jobs = (data.data?.jobSearch?.jobs || [])
        .filter((job: any) => {
          if (!params.jobType) return true
          return job.jobType?.toLowerCase() === params.jobType
        })
        .map((job: any) => ({
          id: job.key,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          salary: job.salary,
          postedDate: job.postedDate,
          description: job.description,
          jobType: job.jobType?.toLowerCase(),
          source: this.name,
        }))

      this.log(`✅ Found ${jobs.length} positions`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.data?.jobSearch?.totalCount || 0,
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
