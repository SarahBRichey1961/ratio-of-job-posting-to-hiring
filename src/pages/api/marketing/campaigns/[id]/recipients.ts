import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const userId = getUserIdFromToken(token)
    if (!userId) {
      console.error('Recipients - Failed to extract user ID from token')
      return res.status(401).json({ error: 'Invalid token' })
    }

    const authenticatedSupabase = await getAuthenticatedSupabase(token)
    if (!authenticatedSupabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    // Use authenticated client for all queries so RLS policies work
    const supabase = authenticatedSupabase

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (req.method === 'GET') {
      // Get recipients for campaign
      const { limit = 50, offset = 0 } = req.query

      const { data: recipients, error, count } = await supabase
        .from('campaign_recipients')
        .select('*', { count: 'exact' })
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (error) throw error

      // Get status breakdown
      const { data: statusBreakdown } = await supabase
        .from('campaign_recipients')
        .select('status')
        .eq('campaign_id', id)

      const breakdown = {
        pending: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        bounced: 0,
      }

      statusBreakdown?.forEach((item: any) => {
        if (breakdown.hasOwnProperty(item.status)) {
          breakdown[item.status as keyof typeof breakdown]++
        }
      })

      res.status(200).json({
        recipients: recipients || [],
        total: count || 0,
        breakdown,
        page: {
          limit: Number(limit),
          offset: Number(offset),
        },
      })
    } else if (req.method === 'POST') {
      // Add recipients from CSV or JSON
      const { recipients } = req.body

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Invalid recipients data' })
      }

      // Validate and prepare recipients
      const validatedRecipients = recipients
        .filter(
          (r: any) => r.email && typeof r.email === 'string' && r.email.includes('@')
        )
        .map((r: any) => {
          // Split name into first_name and last_name if provided
          const fullName = r.name ? r.name.trim() : ''
          const nameParts = fullName.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          return {
            campaign_id: id,
            email: r.email.toLowerCase().trim(),
            first_name: firstName,
            last_name: lastName,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        })

      if (validatedRecipients.length === 0) {
        return res.status(400).json({ error: 'No valid recipients provided' })
      }

      try {
        // Insert recipients (skip duplicates)
        const { data, error } = await supabase
          .from('campaign_recipients')
          .insert(validatedRecipients)
          .select()

        console.log('Recipients POST - Insert attempt:', {
          campaignId: id,
          userId: userId,
          attemptedCount: validatedRecipients.length,
          insertedCount: data?.length || 0,
          successfulInsert: !error && data && data.length > 0,
          error: error ? { code: error.code, message: error.message } : null,
        })

        if (error) {
          // 23505 is unique constraint violation (duplicate)
          if (error.code === '23505') {
            console.log('Recipients POST - Duplicate error (expected):', { campaignId: id })
            return res.status(201).json({
              success: true,
              added: validatedRecipients.length,
              message: `Added ${validatedRecipients.length} recipients to campaign (some may have been duplicates)`,
            })
          }
          // Log actual error for debugging
          console.error('Supabase insert error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          throw error
        }

        console.log('Recipients POST - Insert successful:', { 
          campaignId: id,
          userId: userId,
          insertedCount: data?.length,
          insertedEmails: data?.slice(0, 3)?.map((r: any) => r.email),
        })

        // Verify recipients were actually inserted by querying them back
        const { count: verifyCount, error: verifyError } = await supabase
          .from('campaign_recipients')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', id)

        console.log('Recipients POST - Verification count:', {
          campaignId: id,
          userId: userId,
          expectedCount: data?.length || validatedRecipients.length,
          verifiedCount: verifyCount,
          verifyError: verifyError ? { code: verifyError.code, message: verifyError.message } : null,
        })

        // Update analytics total_recipients count using SERVICE_ROLE to bypass RLS
        if (verifyCount !== null && verifyCount !== undefined) {
          console.log('Recipients POST - Attempting to update analytics:', {
            campaignId: id,
            userId: userId,
            newCount: verifyCount,
            timestamp: new Date().toISOString(),
          })

          try {
            // Use SERVICE_ROLE to update analytics - this bypasses RLS for internal operations
            // This is necessary because auth.uid() doesn't work properly with Bearer tokens on the server
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (!serviceRoleKey) {
              throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
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

            const { data: updateData, error: updateError } = await serviceRoleClient
              .from('campaign_analytics')
              .update({ 
                total_recipients: verifyCount,
                updated_at: new Date().toISOString()
              })
              .eq('campaign_id', id)
              .select()

            console.log('Recipients POST - Analytics update result:', {
              campaignId: id,
              userId: userId,
              newCount: verifyCount,
              updateSuccess: !updateError,
              recordsUpdated: updateData?.length,
              updateError: updateError ? { 
                code: updateError.code, 
                message: updateError.message,
                details: updateError.details,
              } : null,
            })

            if (updateError) {
              console.error('Recipients POST - FAILED to update analytics:', {
                campaignId: id,
                error: updateError,
              })
            } else if (updateData && updateData.length > 0) {
              console.log('Recipients POST - Analytics successfully updated:', {
                campaignId: id,
                newTotal: updateData[0].total_recipients,
              })
            } else {
              console.warn('Recipients POST - Analytics update returned no rows:', {
                campaignId: id,
              })
            }
          } catch (err) {
            console.error('Recipients POST - Exception updating analytics:', {
              error: (err as any).message,
              campaignId: id,
            })
            // Don't fail the request, log and continue
          }
        }

        res.status(201).json({
          success: true,
          added: data?.length || validatedRecipients.length,
          message: `Added ${validatedRecipients.length} recipients to campaign`,
        })
      } catch (insertError: any) {
        console.error('Error inserting recipients:', {
          error: insertError.message,
          status: insertError.status,
          details: insertError.details,
        })
        return res.status(500).json({
          error: 'Failed to add recipients',
          details: insertError.message,
        })
      }
    } else if (req.method === 'DELETE') {
      // Delete all recipients for campaign
      const { error } = await supabase
        .from('campaign_recipients')
        .delete()
        .eq('campaign_id', id)

      if (error) throw error

      // Update analytics total_recipients to 0 using SERVICE_ROLE
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
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

          await serviceRoleClient
            .from('campaign_analytics')
            .update({ 
              total_recipients: 0,
              updated_at: new Date().toISOString()
            })
            .eq('campaign_id', id)
        }
      } catch (err) {
        console.error('Failed to update analytics after deletion:', err)
        // Don't fail the delete operation
      }

      res.status(200).json({
        success: true,
        message: 'All recipients deleted',
      })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error managing recipients:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
