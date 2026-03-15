import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
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
      return res.status(400).json({ 
        error: 'Campaign must be in draft status to send',
        currentStatus: campaign.status,
        hint: campaign.status === 'sent' ? 'To re-send a campaign after editing, save your changes first - the status will automatically reset to draft.' : 'Save your changes to reset campaign to draft status before sending.'
      })
    }

    console.log('📨 Send endpoint - Campaign found, fetching recipients...', { id, campaignStatus: campaign.status })

    // Use SERVICE_ROLE_KEY to bypass RLS for reading recipients
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('📨 Send endpoint - SUPABASE_SERVICE_ROLE_KEY not configured')
      return res.status(500).json({ error: 'Email service not properly configured' })
    }

    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Get recipients with SERVICE_ROLE to bypass RLS
    console.log('📨 Send endpoint - Querying campaign_recipients with SERVICE_ROLE_KEY...')
    const { data: recipients, error: recipientsError } = await serviceRoleClient
      .from('campaign_recipients')
      .select('id, email, first_name, last_name, status')
      .eq('campaign_id', id)
      .eq('status', 'pending')

    console.log('📨 Send endpoint - Recipients query result:', {
      campaignId: id,
      campaignIdType: typeof id,
      campaignIdValue: id,
      userId,
      count: recipients?.length || 0,
      rawCount: recipients ? recipients.length : 'null',
      recipientsData: recipients ? recipients.slice(0, 2) : null,
      error: recipientsError ? { code: recipientsError.code, message: recipientsError.message, details: recipientsError.details } : null,
    })

    // Debug: Query ALL recipients for this campaign (regardless of status)
    console.log('📨 Send endpoint - DEBUG: Querying ALL recipients regardless of status...')
    const { data: allRecipients, error: allRecipientsError } = await serviceRoleClient
      .from('campaign_recipients')
      .select('id, email, status, created_at')
      .eq('campaign_id', id)

    console.log('📨 Send endpoint - All recipients for campaign:', {
      campaignId: id,
      totalCount: allRecipients?.length || 0,
      statusBreakdown: allRecipients ? allRecipients.reduce((acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
      }, {}) : null,
      error: allRecipientsError?.message,
    })

    if (recipientsError) {
      console.error('❌ Send endpoint - Error fetching recipients:', {
        code: recipientsError.code,
        message: recipientsError.message,
        details: recipientsError.details,
        hint: recipientsError.hint,
      })
      if (recipientsError.code === '42501') {
        console.error('❌ Send endpoint - RLS POLICY VIOLATION: Cannot query campaign_recipients')
      }
      throw recipientsError
    }

    if (!recipients || recipients.length === 0) {
      console.error('❌ Send endpoint - No pending recipients found for campaign:', { 
        campaignId: id, 
        receivedCount: recipients?.length, 
        recipientsIsNull: !recipients,
        allRecipientsCount: allRecipients?.length,
      })
      return res.status(400).json({ 
        error: 'No recipients to send to', 
        debug: { 
          pendingCount: recipients?.length || 0,
          totalCount: allRecipients?.length || 0,
        } 
      })
    }
    console.log('📨 Send endpoint - Recipients found, preparing to send...', { id, recipientCount: recipients.length })

    let sentCount = 0
    let failedCount = 0

    // Send emails using Resend
    for (const recipient of recipients) {
      try {
        console.log(`📧 Sending email to ${recipient.email}...`)
        // Replace personalization tokens
        const recipientName = recipient.first_name || (recipient.first_name && `${recipient.first_name} ${recipient.last_name}`.trim()) || recipient.email
        let htmlBody = campaign.email_body_html
          .replace(/\[RECIPIENT_NAME\]/g, recipientName)
          .replace(/\[CAMPAIGN_ID\]/g, id as string)
          .replace(/\[RECIPIENT_ID\]/g, recipient.id)

        // Add tracking pixel
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/marketing/track?campaign_id=${id}&recipient_id=${recipient.id}&event=open" width="1" height="1" alt="" />`
        htmlBody += trackingPixel

        // Send email via Resend
        console.log(`📧 Calling Resend API for ${recipient.email}...`)
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: recipient.email,
            subject: campaign.email_subject,
            html: htmlBody,
            reply_to: campaign.reply_to_email || 'onboarding@resend.dev',
          }),
        })

        const emailResponseText = await emailResponse.text()
        console.log(`📧 Resend response for ${recipient.email}:`, {
          status: emailResponse.status,
          ok: emailResponse.ok,
          fullResponse: emailResponseText,
        })

        if (emailResponse.ok) {
          try {
            const emailData = JSON.parse(emailResponseText)
            console.log(`📧 Email sent successfully to ${recipient.email}, tracking ID: ${emailData.id}`)
            
            // Update recipient status and tracking ID
            const { error: updateError, data: updateData } = await serviceRoleClient
              .from('campaign_recipients')
              .update({
                status: 'sent',
                tracking_id: emailData.id,
              })
              .eq('id', recipient.id)
              .select()

            if (updateError) {
              console.error(`❌ Failed to update recipient ${recipient.id} status to sent:`, {
                error: updateError.message,
                code: updateError.code,
                details: updateError.details,
              })
              failedCount++
              continue
            }

            console.log(`✅ Recipient ${recipient.id} status updated to sent`)
            sentCount++
          } catch (parseError) {
            console.error(`❌ Failed to parse Resend response for ${recipient.email}:`, parseError)
            failedCount++
          }
        } else {
          console.error(`❌ Resend API error for ${recipient.email}:`, {
            status: emailResponse.status,
            response: emailResponseText,
          })
          failedCount++
        }
      } catch (emailError) {
        console.error(`❌ Exception sending email to ${recipient.email}:`, emailError)
        failedCount++
      }
    }

    // Update campaign status
    const { error: updateError } = await serviceRoleClient
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
    const { data: existingAnalytics } = await serviceRoleClient
      .from('campaign_analytics')
      .select('id')
      .eq('campaign_id', id)
      .single()

    if (existingAnalytics) {
      await serviceRoleClient
        .from('campaign_analytics')
        .update({ sent: sentCount })
        .eq('campaign_id', id)
    } else {
      await serviceRoleClient
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
      sent: sentCount,
      failed: failedCount,
      total_recipients: recipients.length,
      stats: {
        total_recipients: recipients.length,
        sent: sentCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('🚀 Send endpoint - Unexpected error:', {
      message: (error as any).message,
      code: (error as any).code,
      status: (error as any).status,
      details: (error as any).details,
      fullError: error,
    })
    res.status(500).json({
      error: (error as any).message || 'Internal server error',
      details: (error as any).details || (error as any).code,
    })
  }
}
