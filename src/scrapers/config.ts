/**
 * Scraper configuration for different job boards
 */

export interface ScraperConfig {
  jobBoardId: number
  jobBoardName: string
  baseUrl: string
  enabled: boolean
  searchQuery?: string
  maxPages?: number
  headless?: boolean // For browser-based scrapers
}

const scraperConfigs: ScraperConfig[] = [
  {
    jobBoardId: 1,
    jobBoardName: 'Indeed',
    baseUrl: 'https://www.indeed.com',
    enabled: true,
    searchQuery: 'software engineer',
    maxPages: 5,
  },
  {
    jobBoardId: 2,
    jobBoardName: 'LinkedIn Jobs',
    baseUrl: 'https://www.linkedin.com/jobs',
    enabled: false, // Requires authentication
    searchQuery: 'software engineer',
    maxPages: 5,
  },
  {
    jobBoardId: 3,
    jobBoardName: 'ZipRecruiter',
    baseUrl: 'https://www.ziprecruiter.com',
    enabled: true,
    searchQuery: 'software engineer',
    maxPages: 3,
  },
  {
    jobBoardId: 8,
    jobBoardName: 'Stack Overflow',
    baseUrl: 'https://stackoverflow.com/jobs',
    enabled: true,
    searchQuery: 'javascript',
    maxPages: 3,
  },
]

export function getEnabledScrapers(): ScraperConfig[] {
  return scraperConfigs.filter((config) => config.enabled)
}

export function getScraperConfig(jobBoardId: number): ScraperConfig | undefined {
  return scraperConfigs.find((config) => config.jobBoardId === jobBoardId)
}

export function getScraperConfigByName(name: string): ScraperConfig | undefined {
  return scraperConfigs.find(
    (config) => config.jobBoardName.toLowerCase() === name.toLowerCase()
  )
}

export const SCRAPER_DEFAULTS = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  USER_AGENT:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  HEADLESS_BROWSER: true,
  IMPLICIT_WAIT: 10000,
  PAGE_LOAD_TIMEOUT: 60000,
}
