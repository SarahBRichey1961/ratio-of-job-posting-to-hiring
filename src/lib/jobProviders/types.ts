/**
 * Universal Job Provider Interface
 * Any job API (LinkedIn, Indeed, Stack Overflow, etc.) implements this
 */

export interface JobListing {
  id: string
  title: string
  company?: string
  location?: string
  url?: string
  salary?: string
  postedDate: string
  description?: string
  jobType?: 'remote' | 'hybrid' | 'onsite'
  source: string // LinkedIn, Indeed, StackOverflow, etc.
}

export interface JobSearchParams {
  query: string
  location?: string
  jobType?: 'remote' | 'hybrid' | 'onsite'
  limit?: number
  postedWithinDays?: number
  hoursBack?: number // Hours to look back for recently posted jobs
}

export interface JobProviderResponse {
  success: boolean
  jobs: JobListing[]
  error?: string
  provider: string
  totalCount?: number
}

export interface JobProvider {
  name: string
  enabled: boolean
  priority: number // Lower = higher priority
  search(params: JobSearchParams): Promise<JobProviderResponse>
  isConfigured(): boolean
}

export interface AggregatedJobSearchResult {
  success: boolean
  query: string
  totalJobs: number
  jobs: JobListing[]
  sources: string[]
  providerResults: {
    [provider: string]: {
      success: boolean
      count: number
      error?: string
    }
  }
}
