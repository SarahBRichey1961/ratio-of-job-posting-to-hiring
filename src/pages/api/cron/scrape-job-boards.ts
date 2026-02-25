import { NextRequest, NextResponse } from 'next/server'
import { runJobBoardScraper } from '@/scripts/scrapers/jobBoardScraper'

/**
 * API endpoint for triggering job board scraper
 * Can be called by external cron service (GitHub Actions, Railway, etc.)
 * 
 * Usage:
 * POST /api/cron/scrape-job-boards
 * Headers: { Authorization: "Bearer YOUR_CRON_SECRET" }
 */

export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get('authorization')
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

    if (!authHeader || authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run scraper
    console.log('🚀 Cron job triggered: Running job board scraper')
    const results = await runJobBoardScraper()

    const successCount = results.filter((r) => r.success).length
    const totalJobs = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + r.jobCount, 0)

    return NextResponse.json({
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
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * For testing the endpoint locally
 */
export async function GET(request: NextRequest) {
  const testSecret = request.searchParams.get('secret')

  if (testSecret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  try {
    console.log('🧪 Test mode: Running job board scraper')
    const results = await runJobBoardScraper()

    return NextResponse.json({
      mode: 'test',
      success: true,
      scrapedAt: new Date().toISOString(),
      resultCount: results.length,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
