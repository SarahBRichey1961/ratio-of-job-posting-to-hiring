import { BaseJobProvider } from './BaseJobProvider'
import { JobSearchParams, JobProviderResponse } from './types'

/**
 * Adzuna Job Search API Provider
 * Free job aggregator with global coverage
 * Docs: https://developer.adzuna.com/
 *
 * Adzuna aggregates jobs from thousands of job boards and company career pages
 * Great alternative to JSearch with good geographic coverage
 */
export class AdzunaProvider extends BaseJobProvider {
  name = 'Adzuna'
  priority = 35 // High priority - free and reliable
  private apiKey: string
  private apiId: string
  private readonly ENDPOINT = 'https://api.adzuna.com/v1/api/jobs'
  private readonly COUNTRIES: { [key: string]: string } = {
    us: 'US',
    uk: 'GB',
    ca: 'CA',
    au: 'AU',
    in: 'IN',
    de: 'DE',
    fr: 'FR',
    nl: 'NL',
  }

  constructor() {
    super()
    this.apiKey = process.env.ADZUNA_API_KEY || ''
    this.apiId = process.env.ADZUNA_API_ID || ''
    this.enabled = this.isConfigured()

    if (!this.enabled) {
      this.log('⚠️ Not configured. Set ADZUNA_API_KEY and ADZUNA_API_ID environment variables.')
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0 && !!this.apiId && this.apiId.length > 0
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
        this.log('⚠️ API credentials not configured, skipping')
        return {
          success: false,
          jobs: [],
          error: 'API credentials not configured',
          provider: this.name,
        }
      }

      this.log(`🔍 Searching for: ${params.query}`)
      this.log(`   Location param: ${params.location ? `"${params.location}"` : 'undefined (nationwide search)'}`)
      this.log(`   Job type: ${params.jobType || 'any'}`)

      // Determine country code from location or default to US for nationwide
      const countryCode = this.getCountryCode(params.location || 'US')

      // Adzuna API endpoint format: /search/{country}/{format}
      const endpoint = `${this.ENDPOINT}/search/${countryCode}/json`

      const queryParams = new URLSearchParams({
        app_id: this.apiId,
        app_key: this.apiKey,
        what: params.query,
        results_per_page: Math.min(params.limit || 30, 50).toString(),
        sort_by: 'date',
      })

      // Add location filter ONLY if a specific location is provided (not nationwide search)
      // Check both that location exists AND is not "US" (nationwide)
      if (params.location && params.location.trim() && params.location.toLowerCase() !== 'us') {
        queryParams.append('where', params.location)
        this.log(`   Adding location filter: "${params.location}"`)
      } else {
        this.log(`   No location filter - searching nationwide (all of ${countryCode})`)
      }

      const url = `${endpoint}?${queryParams}`
      this.log(`📍 Endpoint: ${url.substring(0, 80)}...`)

      const response = await fetch(url)

      if (response.status === 401) {
        throw new Error('Adzuna API credentials invalid (401)')
      }

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API returned ${response.status}: ${error.substring(0, 200)}`)
      }

      const data = await response.json()

      if (!data.results || data.results.length === 0) {
        this.log(`📊 No results returned`)
        return {
          success: true,
          jobs: [],
          provider: this.name,
          totalCount: 0,
        }
      }

      // Filter and map results
      const jobs = (data.results || [])
        .filter((job: any) => {
          if (!params.jobType) return true
          const jobType = this.extractJobType(job)
          return jobType === params.jobType
        })
        .map((job: any) => {
          try {
            // Safely parse date - handle missing or invalid dates
            let postedDate = new Date().toISOString()
            if (job.created) {
              const parsedDate = new Date(job.created)
              if (!isNaN(parsedDate.getTime())) {
                postedDate = parsedDate.toISOString()
              }
            }

            return {
              id: job.id || `adzuna-${job.title}-${Date.now()}`,
              title: job.title || 'Untitled Position',
              company: job.company?.display_name || job.company || 'Unknown Company',
              location: this.formatLocation(job.location),
              url: job.redirect_url || '',
              salary: this.formatSalary(job),
              postedDate,
              description: job.description || '',
              jobType: this.extractJobType(job),
              source: this.name,
            }
          } catch (mapError) {
            this.logError('Error mapping job result', mapError)
            return null
          }
        })
        .filter((job) => job !== null) as any[]

      this.log(`✅ Found ${jobs.length} matching positions from ${data.count} total`)

      return {
        success: true,
        jobs,
        provider: this.name,
        totalCount: data.count || 0,
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
   * Get country code for Adzuna API
   * Defaults to US if not found
   */
  private getCountryCode(location: string): string {
    const lower = location.toLowerCase()

    // Check full country names
    if (lower.includes('united states') || lower.includes('usa')) return 'US'
    if (lower.includes('united kingdom') || lower.includes('uk')) return 'GB'
    if (lower.includes('canada')) return 'CA'
    if (lower.includes('australia')) return 'AU'
    if (lower.includes('india')) return 'IN'
    if (lower.includes('germany')) return 'DE'
    if (lower.includes('france')) return 'FR'
    if (lower.includes('netherlands')) return 'NL'

    // Check country codes
    const code = lower.substring(0, 2).toUpperCase()
    return this.COUNTRIES[code.toLowerCase()] || 'US'
  }

  /**
   * Extract job type from Adzuna response
   */
  private extractJobType(job: any): 'remote' | 'hybrid' | 'onsite' | undefined {
    const description = (job.description || '').toLowerCase()
    const title = (job.title || '').toLowerCase()
    const full = `${title} ${description}`

    if (full.includes('remote') || full.includes('work from home') || full.includes('wfh')) {
      return 'remote'
    }
    if (full.includes('hybrid')) {
      return 'hybrid'
    }
    if (full.includes('on-site') || full.includes('onsite') || full.includes('on site')) {
      return 'onsite'
    }

    return undefined
  }

  /**
   * Format salary from Adzuna response
   */
  private formatSalary(job: any): string | undefined {
    const minSalary = job.salary_min
    const maxSalary = job.salary_max
    const currency = job.salary_currency_code || 'USD'

    if (!minSalary && !maxSalary) {
      return undefined
    }

    // Format based on what's available
    if (minSalary && maxSalary) {
      return `${currency} ${minSalary.toLocaleString()}-${maxSalary.toLocaleString()}`
    } else if (minSalary) {
      return `From ${currency} ${minSalary.toLocaleString()}`
    } else if (maxSalary) {
      return `Up to ${currency} ${maxSalary.toLocaleString()}`
    }

    return undefined
  }

  /**
   * Format location from Adzuna response
   */
  private formatLocation(location: any): string {
    if (!location) return 'Remote'

    if (typeof location === 'string') {
      return location
    }

    if (location.display_name) {
      return location.display_name
    }

    return 'Unknown Location'
  }
}
