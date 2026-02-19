import { NextRequest, NextResponse } from 'next/server'
import { Logger } from '@/lib/logging/logger'
import { supabase } from '@/lib/supabase'

const logger = new Logger('cron-service')

/**
 * Vercel Cron Function: Weekly Insights Email
 * Scheduled: Monday 9:00 AM UTC
 * 
 * GET /api/cron/weekly-insights
 * 
 * This endpoint is called automatically by Vercel's cron service.
 * It generates weekly insights and sends emails to all subscribed users.
 */
export const GET = async (request: NextRequest) => {
  try {
    // Verify the request is from Vercel's cron service
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('Unauthorized cron job attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logger.info('Weekly insights cron job started')

    // Import here to avoid circular dependencies
    const {
      generateWeeklyInsights,
    } = require('@/lib/insightsEngine')
    const { sendInsightsEmailsBatch } = require('@/lib/emailService')

    // Step 1: Generate insights
    const insights = await generateWeeklyInsights()
    logger.info('Insights generated', {
      topBoardsCount: insights.topBoards.length,
      risingBoardsCount: insights.risingBoards.length,
    })

    // Step 2: Fetch verified subscribers
    const { data: subscribers, error: fetchError } = await supabase
      .from('email_subscribers')
      .select('id, email, name')
      .eq('verified', true)
      .eq('subscribe_insights', true)

    if (fetchError) {
      throw new Error(`Failed to fetch subscribers: ${fetchError.message}`)
    }

    if (!subscribers || subscribers.length === 0) {
      logger.warn('No verified subscribers found')
      return NextResponse.json(
        {
          success: false,
          message: 'No verified subscribers to email',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      )
    }

    logger.info(`Found ${subscribers.length} verified subscribers`)

    // Step 3: Send emails in batch
    const results = await sendInsightsEmailsBatch(
      subscribers.map((s: any) => ({
        email: s.email,
        name: s.name || 'Valued User',
      })),
      insights
    )

    logger.info('Emails sent', {
      successful: results.successful,
      failed: results.failed,
    })

    // Step 4: Log the send activity
    const { error: logError } = await supabase
      .from('email_send_logs')
      .insert({
        action: 'weekly-insights',
        total_recipients: subscribers.length,
        successful: results.successful,
        failed: results.failed,
        sent_at: new Date().toISOString(),
      })

    if (logError) {
      logger.error('Failed to log send activity', logError)
      // Don't fail the whole job for logging errors
    }

    const response = {
      success: true,
      message: 'Weekly insights sent successfully',
      totalSubscribers: subscribers.length,
      successful: results.successful,
      failed: results.failed,
      insights: {
        period: insights.period,
        topBoardsCount: insights.topBoards.length,
        claimedBoards: insights.topBoards.filter((b: any) => b.isClimateTechBoard).length,
      },
      timestamp: new Date().toISOString(),
    }

    logger.info('Weekly insights cron job completed successfully', response)
    return NextResponse.json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Weekly insights cron job failed', error as Error)

    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger endpoint (for testing)
 * POST /api/cron/weekly-insights
 * Body: { apiKey: "test-key" }
 */
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Verify manual trigger secret
    if (body.apiKey !== process.env.MANUAL_CRON_KEY) {
      logger.warn('Unauthorized manual cron trigger attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use the same logic as GET
    return GET(request)
  } catch (error) {
    logger.error('Error in manual cron trigger', error as Error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
