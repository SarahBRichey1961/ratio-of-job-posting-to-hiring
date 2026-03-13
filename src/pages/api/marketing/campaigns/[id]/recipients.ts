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
    console.log('🔐 Recipients POST - Campaign verification:', {
      campaignId: id,
      campaignIdType: typeof id,
      userId,
    })
    
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    console.log('🔐 Recipients POST - Verification result:', {
      campaignFound: !!campaign,
      creatorIdMatches: campaign?.creator_id === userId,
      campaignError: campaignError ? { code: campaignError.code, message: campaignError.message } : null,
    })

    if (campaignError || !campaign) {
      console.error('🔐 Recipients POST - Campaign not found or error:', campaignError)
      return res.status(403).json({ error: 'Campaign not found' })
    }
    
    if (campaign.creator_id !== userId) {
      console.error('🔐 Recipients POST - Access denied: creator_id mismatch', {
        campaignCreatorId: campaign.creator_id,
        userId,
      })
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

      console.log('🟦 Recipients POST - Received request:', {
        userId,
        campaignId: id,
        receivedCount: Array.isArray(recipients) ? recipients.length : 'not an array',
        bodyKeys: Object.keys(req.body),
      })

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

      console.log('🟦 Recipients POST - Validated:', {
        validatedCount: validatedRecipients.length,
        sampleEmails: validatedRecipients.slice(0, 3).map((r: any) => r.email),
        campaignIdType: typeof id,
        campaignIdValue: id,
      })

      if (validatedRecipients.length === 0) {
        return res.status(400).json({ error: 'No valid recipients provided' })
      }

      try {
        console.log('🔐 Recipients POST - Using SERVICE_ROLE_KEY to bypass RLS...')
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        console.log('🔐 Recipients POST - Checking environment:', {
          hasServiceRoleKey: !!serviceRoleKey,
          keyLength: serviceRoleKey ? serviceRoleKey.length : 0,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ set' : '✗ missing',
        })
        
        if (!serviceRoleKey) {
          console.error('❌ Recipients POST - SUPABASE_SERVICE_ROLE_KEY not configured!')
          return res.status(500).json({ 
            error: 'Server not configured for recipient uploads', 
            details: 'Missing SUPABASE_SERVICE_ROLE_KEY',
            hint: 'Add SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables'
          })
        }

        // Use SERVICE_ROLE_KEY to bypass RLS - we've already verified ownership above
        console.log('🔐 Recipients POST - Creating serviceRoleClient with KEY...')
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
        
        console.log('🔐 Recipients POST - ServiceRoleClient created, ready for insert')
        
        // Get existing email addresses to filter out duplicates BEFORE inserting
        console.log('🔐 Recipients POST - Checking for existing recipients to skip duplicates...')
        const { data: existingRecipients, error: existingError } = await serviceRoleClient
          .from('campaign_recipients')
          .select('email')
          .eq('campaign_id', id)
        
        if (existingError) {
          console.warn('🟦 Recipients POST - Could not check for duplicates:', existingError)
        }
        
        const existingEmails = new Set(
          (existingRecipients || []).map((r: any) => r.email.toLowerCase().trim())
        )
        
        // Filter out duplicates
        const newRecipients = validatedRecipients.filter((r: any) => !existingEmails.has(r.email))
        const duplicateCount = validatedRecipients.length - newRecipients.length
        
        console.log('🔐 Recipients POST - Duplicate filtering:', {
          totalProvided: validatedRecipients.length,
          willInsert: newRecipients.length,
          duplicatesSkipped: duplicateCount,
          existingInDb: existingEmails.size,
        })
        
        if (newRecipients.length === 0) {
          return res.status(201).json({
            success: true,
            added: 0,
            message: `All ${duplicateCount} recipients already exist in this campaign`,
            debug: {
              insertSuccess: true,
              rowsReturned: 0,
              duplicatesSkipped: duplicateCount,
              insertError: null,
            }
          })
        }

        console.log('🔐 Recipients POST - Attempting INSERT with:', {
          recipientCount: newRecipients.length,
          sampleRecord: newRecipients[0],
        })
        
        const { data, error } = await serviceRoleClient
          .from('campaign_recipients')
          .insert(newRecipients)
          .select()

        console.log('🔐 Recipients POST - INSERT RESULT:', {
          insertError: error ? { code: error.code, message: error.message, details: error.details, hint: error.hint } : null,
          insertSuccess: !error,
          dataReturned: data ? `${data.length} rows` : 'null',
          firstRow: data && data.length > 0 ? { id: data[0].id, email: data[0].email, campaign_id: data[0].campaign_id, status: data[0].status } : null,
        })

        if (error) {
          console.error('❌ Recipients POST - Supabase insert error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          
          // 23505 is unique constraint violation - email already exists
          // This can happen if emails were partially inserted in a previous attempt
          if (error.code === '23505') {
            console.log('🟦 Recipients POST - Duplicate constraint hit, treating as partial success')
            // Re-query to get accurate count of recipients now in database
            const { count: finalCount } = await serviceRoleClient
              .from('campaign_recipients')
              .select('*', { count: 'exact', head: true })
              .eq('campaign_id', id)
            
            // Return success - the duplicates are already in the database
            return res.status(201).json({
              success: true,
              added: Math.max(0, (finalCount || 0) - (existingEmails?.size || 0)),
              message: `Uploaded ${validatedRecipients.length} recipients (${duplicateCount} already exist, new duplicates handled)`,
              debug: {
                insertSuccess: false,
                constraintViolation: true,
                rowsReturned: finalCount,
                duplicatesSkipped: duplicateCount,
                insertError: null,
              }
            })
          }
          
          if (error.code === '42501') {
            console.error('❌ Recipients POST - RLS POLICY VIOLATION: User cannot insert into campaign_recipients')
          }
          
          return res.status(500).json({
            error: 'Failed to add recipients',
            details: error.message || error.code,
            code: error.code,
            hint: error.hint,
            debug: {
              insertSuccess: false,
              rowsReturned: 0,
              insertError: { code: error.code, message: error.message, details: error.details },
            }
          })
        }

        console.log('Recipients POST - Insert successful:', { 
          campaignId: id,
          userId: userId,
          insertedCount: data?.length,
          insertedEmails: data?.slice(0, 3)?.map((r: any) => r.email),
        })

        // Determine recipient count - use INSERT result as primary source
        // If INSERT succeeded and returned data, use that length
        // Otherwise query to verify, but don't let query failure block analytics update
        const insertedCount = data?.length || newRecipients.length
        let totalCount = insertedCount

        // Try to get total count via query for verification purposes
        console.log('🟦 Recipients POST - Querying total recipients to verify...')
        const { count: verifyCount, error: verifyError } = await serviceRoleClient
          .from('campaign_recipients')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', id)

        console.log('🟦 Recipients POST - Verification result:', {
          campaignId: id,
          userId: userId,
          insertedCount,
          verifiedCount: verifyCount,
          verifyError: verifyError ? { code: verifyError.code, message: verifyError.message } : null,
        })

        // Use verified count if available, otherwise use inserted count
        if (verifyCount !== null && verifyCount !== undefined) {
          totalCount = verifyCount
          console.log('✓ Using verified count:', totalCount)
        } else if (verifyError) {
          console.warn('⚠️ Verification query failed, using inserted count instead:', { insertedCount, verifyError: verifyError.message })
          totalCount = insertedCount
        }

        // NOW UPDATE ANALYTICS - ALWAYS EXECUTE THIS AFTER SUCCESSFUL INSERT
        console.log('Recipients POST - Updating analytics with count:', { campaignId: id, totalCount })
        try {
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (!serviceRoleKey) {
            console.error('❌ Recipients POST - SUPABASE_SERVICE_ROLE_KEY not configured')
            return res.status(500).json({ 
              error: 'Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY',
            })
          }

          const srClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              },
            }
          )

          // Simply try to update the analytics record
          // If it doesn't exist, we'll insert it
          console.log('Recipients POST - Updating analytics record...')
          const { data: updateResult, error: updateError } = await srClient
            .from('campaign_analytics')
            .update({ 
              total_recipients: totalCount,
              updated_at: new Date().toISOString(),
            })
            .eq('campaign_id', id as string)
            .select()

          if (updateError) {
            console.error('Recipients POST - UPDATE failed:', updateError.message)
            throw updateError
          }

          // If update didn't affect any rows, the record doesn't exist - try INSERT
          if (!updateResult || updateResult.length === 0) {
            console.log('Recipients POST - No existing analytics record, inserting new one...')
            const { error: insertError } = await srClient
              .from('campaign_analytics')
              .insert({
                campaign_id: id as string,
                total_recipients: totalCount,
                updated_at: new Date().toISOString(),
                total_sent: 0,
                total_bounced: 0,
                total_opened: 0,
                total_clicked: 0,
                total_conversions: 0,
              })

            if (insertError) {
              console.error('Recipients POST - INSERT failed:', insertError.message)
              throw insertError
            }
            console.log('✓ Analytics record inserted')
          } else {
            console.log('✓ Analytics record updated:', {
              totalRecipients: updateResult[0].total_recipients,
            })
          }
        } catch (analyticsErr) {
          console.error('❌ Recipients POST - Analytics error:', (analyticsErr as any).message)
          return res.status(500).json({
            error: 'Failed to update analytics',
            details: (analyticsErr as any).message,
          })
        }

        // SUCCESS: Return after analytics is confirmed updated
        res.status(201).json({
          success: true,
          added: insertedCount,
          message: `Added ${insertedCount} new recipients${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`,
          debug: {
            insertSuccess: true,
            insertedCount,
            totalRecipients: totalCount,
            verifiedCount: verifyCount,
            duplicatesSkipped: duplicateCount,
          }
        })
      } catch (insertError: any) {
        console.error('❌ Recipients POST - Caught exception:', {
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        })
        return res.status(500).json({
          error: 'Failed to add recipients',
          details: insertError.message || insertError.code,
          code: insertError.code,
          hint: insertError.hint,
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
            .upsert({ 
              campaign_id: id,
              total_recipients: 0,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'campaign_id'
            })
        }
      } catch (err) {
        console.error('Failed to upsert analytics after deletion:', err)
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
