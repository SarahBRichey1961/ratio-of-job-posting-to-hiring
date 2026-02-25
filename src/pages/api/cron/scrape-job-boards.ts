import { NextApiRequest, NextApiResponse } from 'next'
import { runJobBoardScraper } from '@/scripts/scrapers/jobBoardScraper'

/**
 * API endpoint for triggering job board scraper
 * Can be called by external cron service (GitHub Actions)
 * 
 * Usage:
 * POST /api/cron/scrape-job-boards
 * Headers: { Authorization: "Bearer YOUR_CRON_SECRET" }
 * 
 * GET /api/cron/scrape-job-boards?secret=YOUR_CRON_SECRET (for testing)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET requests (for testing)
  if (req.method === 'GET') {
    const testSecret = req.query.secret as string | undefined

    if (testSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Invalid secret' })
    }

    try {
      console.log('🧪 Test mode: Running job board scraper')
      const results = await runJobBoardScraper()

      return res.status(200).json({
        mode: 'test',
        success: true,
        scrapedAt: new Date().toISOString(),
        resultCount: results.length,
        results,
      })
    } catch (error) {
      console.error('Scraper error:', error)
      return res.status(500).json({ error: String(error) })
    }
  }

  // Handle POST requests (from GitHub Actions)
  if (req.method === 'POST') {
    try {
      // Validate cron secret
      const authHeader = req.headers.authorization
      const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

      if (!authHeader || authHeader !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Run scraper
      console.log('🚀 Cron job triggered: Running job board scraper')
      const results = await runJobBoardScraper()

      const successCount = results.filter((r) => r.success).length
      const totalJobs = results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + r.jobCount, 0)

      return res.status(200).json({
        success: true,
        scrapedAt: new Date().toISOString(),
        resultCount: results.length,
        successCount,
        totalJobsFound: totalJobs,
        results: results.map((r) => ({
          boardName: r.boardName,
          jobCount: r.jobCount,
          success: r.success,
          error: r.error,
        })),
      })
    } catch (error) {
      console.error('Scraper error:', error)
      return res.status(500).json({ error: String(error) })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' })
}

