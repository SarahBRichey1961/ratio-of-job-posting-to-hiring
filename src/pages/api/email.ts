import type { NextApiRequest, NextApiResponse } from 'next'
import { generateWeeklyInsights } from '@/lib/insightsEngine'
import { sendInsightsEmailsBatch, sendTestEmail } from '@/lib/emailService'
import { supabase } from '@/lib/supabase'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')

interface ResponseData {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  const { action, testEmail } = req.body

  try {
    // Test email endpoint
    if (action === 'test-email' && testEmail) {
      const result = await sendTestEmail(testEmail)
      return res.status(result.success ? 200 : 500).json(result)
    }

    // Send weekly insights
    if (action === 'send-insights') {
      // Generate insights
      logger.info('Generating weekly insights...')
      const insights = await generateWeeklyInsights()

      // Get email subscribers
      logger.info('Fetching email subscribers...')
      const { data: subscribers, error: subscribersError } = await supabase
        .from('email_subscribers')
        .select('email, name, subscribe_insights')
        .eq('subscribe_insights', true)
        .eq('verified', true)

      if (subscribersError) {
        logger.error('Failed to fetch subscribers', subscribersError as Error)
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch subscribers',
        })
      }

      if (!subscribers || subscribers.length === 0) {
        logger.warn('No subscribers found for insights email')
        return res.status(200).json({
          success: true,
          data: {
            message: 'No subscribers found',
            sent: 0,
          },
        })
      }

      // Send emails to subscribers
      logger.info(`Sending insights emails to ${subscribers.length} subscribers...`)
      const emailResults = await sendInsightsEmailsBatch(
        subscribers.map((sub) => ({
          email: sub.email,
          name: sub.name,
        })),
        insights
      )

      // Log send results
      logger.info('Insights emails sent', {
        total: subscribers.length,
        successful: emailResults.successful,
        failed: emailResults.failed,
      })

      // Store send event
      try {
        await supabase.from('email_send_logs').insert({
          action: 'weekly-insights',
          total_recipients: subscribers.length,
          successful: emailResults.successful,
          failed: emailResults.failed,
          sent_at: new Date(),
        })
      } catch (error) {
        logger.warn('Failed to log email send event', error as Error)
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Insights emails sent',
          totalSubscribers: subscribers.length,
          successful: emailResults.successful,
          failed: emailResults.failed,
          insights: {
            topBoards: insights.topBoards.length,
            risingBoards: insights.risingBoards.length,
            decliningBoards: insights.decliningBoards.length,
          },
        },
      })
    }

    // Invalid action
    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use "test-email" or "send-insights".',
    })
  } catch (error) {
    logger.error('Error in email endpoint', error as Error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
