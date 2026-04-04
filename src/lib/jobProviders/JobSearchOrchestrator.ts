import {
  JobProvider,
  JobSearchParams,
  AggregatedJobSearchResult,
} from './types'

/**
 * Job Search Orchestrator
 * Manages multiple job provider APIs and aggregates results
 *
 * Features:
 * - Parallel API calls for speed
 * - De-duplication of jobs across sources
 * - Priority-based provider ordering
 * - Graceful fallback handling
 * - Result scoring and ranking
 * - Configurable provider enable/disable
 */
export class JobSearchOrchestrator {
  private providers: JobProvider[] = []

  constructor(providers: JobProvider[]) {
    // Sort by priority (lower = higher priority)
    this.providers = providers.sort((a, b) => a.priority - b.priority)
    this.logConfiguration()
  }

  /**
   * Search across all enabled providers in parallel
   * Returns aggregated, de-duplicated results
   */
  async search(
    params: JobSearchParams
  ): Promise<AggregatedJobSearchResult> {
    const enabledProviders = this.getEnabledProviders()
    const disabledProviders = this.providers.filter((p) => !p.enabled)
    
    console.log(`\n🚀 Job Search Orchestrator Starting`)
    console.log(
      `📋 Query: "${params.query}" | Enabled: ${enabledProviders.length} | Disabled: ${disabledProviders.length}`
    )
    console.log(`   ✓ Enabled: ${enabledProviders.map((p) => p.name).join(', ')}`)
    if (disabledProviders.length > 0) {
      console.log(`   ✗ Disabled: ${disabledProviders.map((p) => p.name).join(', ')}`)
    }

    if (enabledProviders.length === 0) {
      console.error('❌ No job providers configured!')
      return {
        success: false,
        query: params.query,
        totalJobs: 0,
        jobs: [],
        sources: [],
        providerResults: {},
      }
    }

    // Execute all enabled providers in parallel
    const searches = enabledProviders.map((provider) =>
      this.searchWithProvider(provider, params)
    )

    const results = await Promise.allSettled(searches)

    // Aggregate results from all providers
    const aggregated = this.aggregateResults(results, params.query)

    console.log(
      `\n✨ Search Complete: ${aggregated.totalJobs} unique jobs from ${aggregated.sources.length} sources`
    )

    return aggregated
  }

  /**
   * Search with a single provider with error handling and timeout
   */
  private async searchWithProvider(
    provider: JobProvider,
    params: JobSearchParams
  ) {
    // 20-second timeout per provider to stay within Netlify function limits
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${provider.name} timed out after 20s`)), 20000)
    )
    const search = provider.search(params)
    const response = await Promise.race([search, timeout])
    return {
      provider,
      response,
    }
  }

  /**
   * Aggregate results from multiple providers
   * - De-duplicate by ID and title
   * - Add source attribution
   * - Sort by relevance
   */
  private aggregateResults(
    settledResults: PromiseSettledResult<any>[],
    query: string
  ): AggregatedJobSearchResult {
    const jobMap = new Map<string, any>() // De-duplication map
    const sourceSet = new Set<string>()
    const providerResults: {
      [provider: string]: { success: boolean; count: number; error?: string }
    } = {}

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        const { provider, response } = result.value

        providerResults[provider.name] = {
          success: response.success,
          count: response.jobs?.length || 0,
          error: response.error,
        }

        if (response.success && response.jobs?.length > 0) {
          sourceSet.add(provider.name)

          for (const job of response.jobs) {
            // De-duplicate by URL first (most reliable)
            if (job.url) {
              if (!jobMap.has(job.url)) {
                jobMap.set(job.url, job)
              }
            } else {
              // Fallback: De-duplicate by title + company
              const key = `${job.title}-${job.company}`
              if (!jobMap.has(key)) {
                jobMap.set(key, job)
              }
            }
          }
        }
      } else {
        // Provider promise rejected (timeout or uncaught error)
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason)
        console.error(`Provider error:`, errorMsg)
        // Extract provider name from timeout error message
        const nameMatch = errorMsg.match(/^(.+?) timed out/)
        if (nameMatch) {
          providerResults[nameMatch[1]] = {
            success: false,
            count: 0,
            error: errorMsg,
          }
        }
      }
    }

    const uniqueJobs = Array.from(jobMap.values())

    // Sort by posted date (most recent first), fallback to no specific order
    const sortedJobs = uniqueJobs.sort((a, b) => {
      if (a.postedDate && b.postedDate) {
        return (
          new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        )
      }
      return 0
    })

    return {
      success: uniqueJobs.length > 0,
      query,
      totalJobs: uniqueJobs.length,
      jobs: sortedJobs,
      sources: Array.from(sourceSet),
      providerResults,
    }
  }

  /**
   * Get all enabled providers sorted by priority
   */
  private getEnabledProviders(): JobProvider[] {
    return this.providers.filter((p) => p.enabled)
  }

  /**
   * Enable/disable a provider by name
   */
  setProviderEnabled(providerName: string, enabled: boolean): void {
    const provider = this.providers.find((p) => p.name === providerName)
    if (provider) {
      provider.enabled = enabled
      console.log(
        `${enabled ? '✅' : '❌'} ${providerName} is now ${enabled ? 'enabled' : 'disabled'}`
      )
    }
  }

  /**
   * Get provider configuration
   */
  getConfiguration() {
    return {
      providers: this.providers.map((p) => ({
        name: p.name,
        enabled: p.enabled,
        priority: p.priority,
        configured: p.isConfigured(),
      })),
      enabledCount: this.getEnabledProviders().length,
    }
  }

  /**
   * Log current configuration
   */
  private logConfiguration(): void {
    const config = this.getConfiguration()
    console.log(`\n📊 Job Provider Configuration:`)
    config.providers.forEach((p) => {
      const status = p.enabled ? '✅' : '❌'
      const configured = p.configured ? '🔐' : '⚠️'
      console.log(
        `  ${status} ${p.name} (priority: ${p.priority}, configured: ${configured})`
      )
    })
  }
}
