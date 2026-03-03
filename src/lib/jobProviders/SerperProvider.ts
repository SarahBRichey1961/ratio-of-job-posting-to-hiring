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

      // Add date filter for recently posted jobs (3 days by default)
      const daysBack = Math.ceil((params.hoursBack || 72) / 24)
      searchQuery += ` posted:${daysBack}d`

      const payload = {
        q: searchQuery,
        gl: 'us',
        hl: 'en',
        num: Math.min(params.limit || 30, 100),
      }

      this.log(`📍 Payload: ${JSON.stringify(payload)}`)

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
      this.log(`📊 Serper response keys: ${Object.keys(data).join(', ')}`)

      // Serper returns results in 'organic' array for web search
      // or 'jobs' array if specifically formatted for jobs
      const results = data.jobs || data.organic || []

      if (!results || results.length === 0) {
        this.log(`📊 No Serper results found for: ${searchQuery}`)
        return {
          success: true,
          jobs: [],
          provider: this.name,
          totalCount: 0,
        }
      }

      this.log(`✅ Found ${results.length} results from Serper`)

      // Map Serper response to our standard job format
      const jobs = results
        .slice(0, Math.min(results.length, params.limit || 30))
        .map((result: any) => {
          try {
            // Handle both jobs array and organic search results
            // Organic results: {title, link, snippet}
            // Jobs results (if available): {title, company, location, link, snippet, date}
            // Estimate posted date from metadata if available, otherwise estimate as recent
            let postedDate = new Date().toISOString()
            if (result.date) {
              try {
                postedDate = new Date(result.date).toISOString()
              } catch {
                // Keep default current date
              }
            }

            return {
              id: result.link || `serper-${result.title}-${Date.now()}`,
              title: result.title || 'Position Available',
              company: result.company || this.extractCompanyFromTitle(result.title),
              location: result.location || this.extractLocationFromSnippet(result.snippet),
              url: result.link || '',
              description: result.snippet || '',
              postedDate,
              jobType: this.extractJobType(result),
              source: this.name,
            }
          } catch (mapError) {
            this.logError('Error mapping Serper result', mapError)
            return null
          }
        })
        .filter((job) => job !== null && job.url) as any[]

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: jobs.length,
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

  private extractCompanyFromTitle(title: string): string {
    // Try to extract company name from title (usually first part before role)
    const match = title.match(/^.*?(at|@|—|–|-)\s*(.+?)(?:\s+|$)/)
    return match ? match[2].trim() : 'Unknown Company'
  }

  private extractLocationFromSnippet(snippet: string = ''): string {
    // Look for common location indicators in snippet
    const locationMatch = snippet.match(/(?:in|at|located in|based in)\s+([^,\n]+)/i)
    return locationMatch ? locationMatch[1].trim() : 'Remote'
  }

  private extractJobType(
    result: any
  ): 'remote' | 'hybrid' | 'onsite' | undefined {
    const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase()

    if (text.includes('remote') || text.includes('work from home') || text.includes('wfh')) {
      return 'remote'
    }
    if (text.includes('hybrid')) {
      return 'hybrid'
    }
    if (text.includes('on-site') || text.includes('on site') || text.includes('onsite')) {
      return 'onsite'
    }

    return undefined
  }
}
