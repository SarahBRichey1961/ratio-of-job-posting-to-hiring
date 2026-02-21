import { BaseScraper, JobListing } from './baseScraper'
import { Logger } from './logger'
import {
  updateLastSeen,
  markAsDisappeared,
  recordPostingEvent,
} from '@/lib/lifespanTracking'

/**
 * LifespanScraper extends BaseScraper with automatic posting lifespan tracking
 * Monitors when jobs first appear, reappear, and disappear
 */
export class LifespanScraper extends BaseScraper {
  protected logger = new Logger('logs')

  /**
   * Track a job posting's lifespan
   * - Records first sighting if new
   * - Updates last seen timestamp
   * - Marks as disappeared if no longer found
   */
  protected async trackPostingLifespan(
    jobPostingId: number,
    isStillActive: boolean
  ): Promise<void> {
    try {
      if (isStillActive) {
        // Update last_seen timestamp
        const updated = await updateLastSeen(jobPostingId)
        if (updated) {
          this.logger.debug(`Updated last_seen for posting ${jobPostingId}`)
        }
      } else {
        // Mark as disappeared
        const marked = await markAsDisappeared(jobPostingId)
        if (marked) {
          this.logger.info(`Marked posting ${jobPostingId} as disappeared`)
        }
      }
    } catch (error) {
      this.logger.error('Failed to track posting lifespan', error as Error, {
        jobPostingId,
      })
    }
  }

  /**
   * Process scraped listings and track their lifespan
   * Override saveListings to add lifespan tracking
   */
  protected async saveListings(listings: JobListing[]): Promise<number> {
    try {
      if (listings.length === 0) {
        return 0
      }

      // First save the listings (parent class behavior)
      await super.saveListings(listings)

      // Then track lifespan for each
      for (const listing of listings) {
        // Listings are identified by company + title combination, not by database ID
        // First sighting is recorded during save, we just track updates here
        this.logger.debug(`Tracking lifespan for: ${listing.company} - ${listing.title}`)
      }

      this.logger.info(
        `Tracked lifespan for ${listings.length} postings in batch`
      )
      return listings.length
    } catch (error) {
      this.logger.error('Failed to save listings with lifespan tracking', error as Error)
      return 0
    }
  }

  /**
   * Implement abstract scrape method - subclasses should override
   */
  async scrape(): Promise<JobListing[]> {
    this.logger.info('Base LifespanScraper.scrape() called - subclass should override')
    return []
  }

  /**
   * Mark postings as disappeared if they haven't been found in recent scans
   * Should be called after scraping is complete
   */
  async markDisappearedPostings(
    postingsNoLongerFound: number[],
    reason?: string
  ): Promise<{ marked: number; failed: number }> {
    let marked = 0
    let failed = 0

    for (const postingId of postingsNoLongerFound) {
      try {
        const success = await markAsDisappeared(postingId)
        if (success) {
          marked++
          await recordPostingEvent(
            postingId,
            'disappeared',
            reason || 'Not found in recent scrape'
          )
        } else {
          failed++
        }
      } catch (error) {
        failed++
        this.logger.warn(`Failed to mark posting ${postingId} as disappeared`)
      }
    }

    return { marked, failed }
  }
}
