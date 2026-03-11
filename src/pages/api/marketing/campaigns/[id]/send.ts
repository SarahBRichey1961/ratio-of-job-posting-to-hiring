import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'

// Resend email service - add your API key to environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  try {
    console.log('📨 Send endpoint - Extracting user ID from JWT token...')
    const userId = getUserIdFromToken(token)
    if (!userId) {
      console.error('📨 Send endpoint - Failed to extract user ID from token')
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.log('📨 Send endpoint - User authenticated:', userId)

    const authenticatedSupabase = await getAuthenticatedSupabase(token)
    if (!authenticatedSupabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    // Use authenticated client for all queries so RLS policies work
    const supabase = authenticatedSupabase

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (campaign.status !== 'draft') {
      console.warn('📨 Send endpoint - Campaign not in draft status:', { id, status: campaign.status })
      return res.status(400).json({ error: 'Campaign must be in draft status to send' })
    }

    console.log('📨 Send endpoint - Campaign found, fetching recipients...', { id })

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('campaign_recipients')
      .select('id, email, name')
      .eq('campaign_id', id)
      .eq('status', 'pending')

    if (recipientsError) {
      throw recipientsError
    }

    if (!recipients || recipients.length === 0) {
      console.error('📨 Send endpoint - No recipients found for campaign:', { id, count: recipients?.length })
      return res.status(400).json({ error: 'No recipients to send to' })
    }
    console.log('📨 Send endpoint - Recipients found, preparing to send...', { id, recipientCount: recipients.length })

    let sentCount = 0
    let failedCount = 0

    // Send emails using Resend
    for (const recipient of recipients) {
      try {
        // Replace personalization tokens
        let htmlBody = campaign.email_body_html
          .replace(/\[RECIPIENT_NAME\]/g, recipient.name || recipient.email)
          .replace(/\[CAMPAIGN_ID\]/g, id as string)
          .replace(/\[RECIPIENT_ID\]/g, recipient.id)

        // Add tracking pixel
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/marketing/track?campaign_id=${id}&recipient_id=${recipient.id}&event=open" width="1" height="1" alt="" />`
        htmlBody += trackingPixel

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@takethereigns.com',
            to: recipient.email,
            subject: campaign.email_subject,
            html: htmlBody,
            reply_to: campaign.reply_to_email || process.env.RESEND_REPLY_TO || 'support@takethereigns.com',
          }),
        })

        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          // Update recipient status and tracking ID
          await supabase
            .from('campaign_recipients')
            .update({
              status: 'sent',
              tracking_id: emailData.id,
              sent_at: new Date().toISOString(),
            })
            .eq('id', recipient.id)

          sentCount++
        } else {
          console.error(`Failed to send email to ${recipient.email}:`, await emailResponse.text())
          failedCount++
        }
      } catch (emailError) {
        console.error(`Error sending email to ${recipient.email}:`, emailError)
        failedCount++
      }
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('marketing_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    // Update or create analytics record
    const { data: existingAnalytics } = await supabase
      .from('campaign_analytics')
      .select('id')
      .eq('campaign_id', id)
      .single()

    if (existingAnalytics) {
      await supabase
        .from('campaign_analytics')
        .update({ sent: sentCount })
        .eq('campaign_id', id)
    } else {
      await supabase
        .from('campaign_analytics')
        .insert({
          campaign_id: id,
          sent: sentCount,
          bounced: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
        })
    }

    res.status(200).json({
      success: true,
      message: `Campaign sent successfully`,
      stats: {
        total_recipients: recipients.length,
        sent: sentCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
