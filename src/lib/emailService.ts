import { Resend } from 'resend'
import { WeeklyInsightsEmail } from '@/components/WeeklyInsightsEmail'
import { WeeklyInsights } from '@/lib/insightsEngine'
import { Logger } from '@/lib/logging/logger'

const logger = new Logger('logs')

// Initialize Resend client lazily to handle missing API key gracefully
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export interface EmailRecipient {
  email: string
  name: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send weekly insights email to a recipient
 */
export async function sendInsightsEmail(
  recipient: EmailRecipient,
  insights: WeeklyInsights
): Promise<EmailSendResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured')
      return {
        success: false,
        error: 'Email service not configured',
      }
    }

    const resend = getResendClient()
    if (!resend) {
      logger.warn('Failed to initialize Resend client')
      return {
        success: false,
        error: 'Email service not available',
      }
    }

    // Prepare template props
    const templateProps = {
      recipientName: recipient.name.split(' ')[0], // First name only
      topBoards: insights.topBoards,
      risingBoards: insights.risingBoards,
      decliningBoards: insights.decliningBoards,
      insights: insights.insights,
      surveyStats: {
        weeklyEmployerSurveys: insights.surveyStats.weeklyEmployerSurveys,
        weeklyCandidateSurveys: insights.surveyStats.weeklyCandidateSurveys,
      },
    }

    // Send email via Resend
    const response = await resend.emails.send({
      from: 'insights@jobboardscorer.com',
      to: recipient.email,
      subject: '📊 Weekly Job Board Insights — Your Performance Report',
      react: WeeklyInsightsEmail(templateProps),
    })

    if (response.error) {
      logger.error('Failed to send insights email', new Error(response.error.message), {
        recipient: recipient.email,
      })
      return {
        success: false,
        error: response.error.message,
      }
    }

    logger.info('Insights email sent successfully', {
      recipient: recipient.email,
      messageId: response.data?.id,
    })

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    logger.error('Error sending insights email', error as Error, {
      recipient: recipient.email,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send insights emails to multiple recipients
 */
export async function sendInsightsEmailsBatch(
  recipients: EmailRecipient[],
  insights: WeeklyInsights
): Promise<{
  successful: number
  failed: number
  results: Array<{ recipient: string; result: EmailSendResult }>
}> {
  const results: Array<{ recipient: string; result: EmailSendResult }> = []
  let successful = 0
  let failed = 0

  for (const recipient of recipients) {
    const result = await sendInsightsEmail(recipient, insights)
    results.push({ recipient: recipient.email, result })

    if (result.success) {
      successful++
    } else {
      failed++
    }

    // Rate limiting: wait 100ms between emails
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  logger.info('Batch email send complete', {
    total: recipients.length,
    successful,
    failed,
  })

  return { successful, failed, results }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(email: string): Promise<EmailSendResult> {
  try {
    const resend = getResendClient()
    if (!resend) {
      return {
        success: false,
        error: 'Email service not available',
      }
    }

    const response = await resend.emails.send({
      from: 'test@jobboardscorer.com',
      to: email,
      subject: '✅ Test Email from Job Board Scorer',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this, your RESEND_API_KEY is properly configured.</p>
      `,
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
