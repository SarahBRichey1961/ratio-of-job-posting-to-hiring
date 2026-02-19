import { supabase } from '@/lib/supabase'
import { Logger } from './logger'

export interface JobListing {
  title: string
  company: string
  url: string
  description?: string
  location?: string
  jobBoardId: number
  scrapedAt: Date
}

export interface ScrapingResult {
  jobBoardId: number
  jobBoardName: string
  jobsScraped: number
  newJobs: number
  errors: any[]
  startTime: Date
  endTime: Date
  duration: number
}

export abstract class BaseScraper {
  protected logger: Logger
  protected jobBoardId: number
  protected jobBoardName: string
  protected baseUrl: string
  protected timeout: number = 30000 // 30 seconds by default

  constructor(jobBoardId: number, jobBoardName: string, baseUrl: string) {
    this.jobBoardId = jobBoardId
    this.jobBoardName = jobBoardName
    this.baseUrl = baseUrl
    this.logger = new Logger('logs')
  }

  /**
   * Main scraping method - implement in subclass
   */
  abstract scrape(): Promise<JobListing[]>

  /**
   * Fetch a URL with error handling
   */
  protected async fetchUrl(url: string): Promise<string> {
    try {
      this.logger.debug(`Fetching URL: ${url}`)

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: this.timeout,
      } as any)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      this.logger.error(
        `Failed to fetch URL: ${url}`,
        error as Error,
        { url }
      )
      throw error
    }
  }

  /**
   * Save job listings to database
   */
  protected async saveListings(listings: JobListing[]): Promise<number> {
    if (listings.length === 0) {
      this.logger.info('No listings to save')
      return 0
    }

    try {
      this.logger.info(`Saving ${listings.length} listings to database`)

      const jobPostings = listings.map((job) => ({
        job_board_id: job.jobBoardId,
        title: job.title,
        company: job.company,
        url: job.url,
        description: job.description,
        location: job.location,
        first_seen: job.scrapedAt,
        last_seen: job.scrapedAt,
      }))

      const { error, count } = await supabase
        .from('job_postings')
        .upsert(jobPostings, { onConflict: 'url' })

      if (error) {
        this.logger.error('Database error while saving listings', error as Error)
        throw error
      }

      this.logger.info(`Successfully saved/updated ${count} listings`)
      return count || 0
    } catch (error) {
      this.logger.error(
        'Failed to save listings',
        error as Error,
        { count: listings.length }
      )
      throw error
    }
  }

  /**
   * Record a scraping event
   */
  protected async recordEvent(
    jobPostingId: number,
    eventType: 'appeared' | 'reappeared' | 'disappeared'
  ): Promise<void> {
    try {
      const { error } = await supabase.from('posting_events').insert({
        job_posting_id: jobPostingId,
        event_type: eventType,
        event_date: new Date(),
      })

      if (error) throw error
    } catch (error) {
      this.logger.warn(
        `Failed to record event for job ${jobPostingId}`,
        undefined,
        error as Error
      )
    }
  }

  /**
   * Run the complete scraping process
   */
  async run(): Promise<ScrapingResult> {
    const startTime = new Date()
    const errors: any[] = []

    try {
      this.logger.info(`Starting scrape for ${this.jobBoardName}`)

      const listings = await this.scrape()
      const newJobs = await this.saveListings(listings)

      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      const result: ScrapingResult = {
        jobBoardId: this.jobBoardId,
        jobBoardName: this.jobBoardName,
        jobsScraped: listings.length,
        newJobs,
        errors,
        startTime,
        endTime,
        duration,
      }

      this.logger.info(
        `Scraping complete for ${this.jobBoardName}`,
        result
      )

      return result
    } catch (error) {
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      this.logger.error(
        `Scraping failed for ${this.jobBoardName}`,
        error as Error
      )

      errors.push({
        code: 'SCRAPE_FAILED',
        message: (error as Error).message,
      })

      return {
        jobBoardId: this.jobBoardId,
        jobBoardName: this.jobBoardName,
        jobsScraped: 0,
        newJobs: 0,
        errors,
        startTime,
        endTime,
        duration,
      }
    }
  }
}
