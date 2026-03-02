import { JobProvider, JobSearchParams, JobProviderResponse } from './types'

/**
 * Abstract base class for all job providers
 */
export abstract class BaseJobProvider implements JobProvider {
  abstract name: string
  enabled: boolean = true
  priority: number = 100

  abstract search(params: JobSearchParams): Promise<JobProviderResponse>

  /**
   * Check if API credentials are configured
   */
  abstract isConfigured(): boolean

  /**
   * Validate search parameters
   */
  protected validateParams(params: JobSearchParams): boolean {
    return !!params.query && params.query.trim().length > 0
  }

  /**
   * Log provider activity
   */
  protected log(message: string, data?: any): void {
    console.log(`[${this.name}] ${message}`, data || '')
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.name}] ❌ ${message}`, error)
  }
}
