import { BaseScraper, JobListing } from '@/lib/logging/baseScraper'
import { normalizeJobTitle } from '@/lib/titleNormalization'

/**
 * Enhanced scraper that automatically normalizes job titles during scraping
 */
export abstract class NormalizingScraper extends BaseScraper {
  /**
   * Save job listings with automatic title normalization
   */
  protected async saveListings(listings: JobListing[]): Promise<number> {
    if (listings.length === 0) {
      this.logger.info('No listings to save')
      return 0
    }

    try {
      this.logger.info(`Saving ${listings.length} listings with normalized titles`)

      const jobPostings = listings.map((job) => ({
        job_board_id: job.jobBoardId,
        title: job.title,
        normalized_title: normalizeJobTitle(job.title),
        company: job.company,
        url: job.url,
        description: job.description,
        location: job.location,
        first_seen: job.scrapedAt,
        last_seen: job.scrapedAt,
      }))

      const { error, count } = await this.supabase
        .from('job_postings')
        .upsert(jobPostings, { onConflict: 'url' })

      if (error) {
        this.logger.error('Database error while saving listings', error as Error)
        throw error
      }

      this.logger.info(`Successfully saved/updated ${count} listings with normalization`)
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

  // Access to supabase in subclass
  protected get supabase() {
    const { supabase } = require('@/lib/supabase')
    return supabase
  }
}
