import { Logger } from './logging/logger'

const logger = new Logger('logs')

/**
 * Schedule configuration for weekly emails
 * Runs every Monday at 9:00 AM UTC
 */
export const WEEKLY_INSIGHTS_SCHEDULE = {
  cronExpression: '0 9 * * MON', // Monday 9 AM UTC
  timezone: 'UTC',
  description: 'Send weekly insights emails to subscribers',
}

/**
 * Schedule configuration for alerts (future use)
 * Runs every day at 8:00 AM UTC
 */
export const DAILY_ALERTS_SCHEDULE = {
  cronExpression: '0 8 * * *', // Daily 8 AM UTC
  timezone: 'UTC',
  description: 'Send daily alerts to subscribers',
}

/**
 * Trigger the insights email sending
 * Can be called from:
 * 1. Vercel Cron Functions (scheduled)
 * 2. Supabase Edge Functions (scheduled)
 * 3. External cron service (webhook)
 * 4. Manual API call for testing
 */
export async function triggerWeeklyInsights(): Promise<{
  success: boolean
  message: string
  timestamp: string
}> {
  try {
    logger.info('Triggering weekly insights email send...')

    const response = await fetch(
      process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/email`
        : 'http://localhost:3000/api/email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.API_KEY || '',
        },
        body: JSON.stringify({
          action: 'send-insights',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      logger.error('Failed to trigger insights email', new Error(error))
      return {
        success: false,
        message: `HTTP ${response.status}: ${error}`,
        timestamp: new Date().toISOString(),
      }
    }

    const data = await response.json()

    logger.info('Weekly insights triggered successfully', {
      successful: data.data?.successful,
      failed: data.data?.failed,
    })

    return {
      success: true,
      message: `Sent insights to ${data.data?.successful || 0} subscribers`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    logger.error('Error triggering weekly insights', error as Error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Utility to get next scheduled run time
 */
export function getNextScheduledRun(): Date {
  const now = new Date()
  const nextMonday = new Date(now)

  // Move to next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(now.getDate() + daysUntilMonday)

  // Set to 9:00 AM UTC
  nextMonday.setUTCHours(9, 0, 0, 0)

  return nextMonday
}

/**
 * Check if it's time to run scheduled task
 */
export function isScheduledTime(checkHour: number = 9, checkDay: number = 1): boolean {
  const now = new Date()
  return (
    now.getUTCDay() === checkDay &&
    now.getUTCHours() === checkHour
  )
}

/**
 * Implementation guide for Vercel Cron Functions:
 * 
 * 1. Create /pages/api/cron/weekly-insights.ts
 * 2. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/weekly-insights",
 *        "schedule": "0 9 * * MON"
 *      }]
 *    }
 * 
 * 3. In the endpoint:
 *    import { triggerWeeklyInsights } from '@/lib/scheduleManager'
 *    
 *    export default async function handler(req, res) {
 *      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
 *      
 *      const result = await triggerWeeklyInsights()
 *      return res.status(200).json(result)
 *    }
 */

/**
 * Implementation guide for Supabase Edge Functions:
 * 
 * 1. Create supabase/functions/send-weekly-insights/index.ts
 * 2. Deploy: supabase functions deploy send-weekly-insights
 * 3. Create scheduled trigger in Supabase Dashboard:
 *    - Functions > Scheduling
 *    - Create new cron: "0 9 * * MON"
 *    - Call function: send-weekly-insights
 * 
 * 4. Edge function content:
 *    import { triggerWeeklyInsights } from '@/lib/scheduleManager'
 *    
 *    Deno.serve(async (req) => {
 *      const result = await triggerWeeklyInsights()
 *      return new Response(JSON.stringify(result), {
 *        headers: { 'Content-Type': 'application/json' }
 *      })
 *    })
 */
