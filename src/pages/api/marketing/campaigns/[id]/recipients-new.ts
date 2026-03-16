import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase, getUserIdFromToken } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Helper function to set CORS headers
function setCORSHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all responses
  setCORSHeaders(res)

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { id } = req.query
  const authHeader = req.headers.authorization

  // ===== AUTH VALIDATION =====
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)
  const userId = getUserIdFromToken(token)
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    const authenticatedSupabase = await getAuthenticatedSupabase(token)
    if (!authenticatedSupabase) {
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    // ===== CAMPAIGN OWNERSHIP =====
    const { data: campaign, error: campaignError } = await authenticatedSupabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== userId) {
      return res.status(403).json({ error: 'Campaign access denied' })
    }

    // ===== GET METHOD =====
    if (req.method === 'GET') {
      const { limit = 50, offset = 0 } = req.query

      const { data: recipients, error, count } = await authenticatedSupabase
        .from('campaign_recipients')
        .select('*', { count: 'exact' })
        .eq('campaign_id', id)
        .order('created_at', { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

      if (error) throw error

      const { data: statusBreakdown } = await authenticatedSupabase
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

      return res.status(200).json({
        recipients: recipients || [],
        total: count || 0,
        breakdown,
      })
    }

    // ===== POST METHOD (ADD RECIPIENTS) =====
    if (req.method === 'POST') {
      const { recipients: incomingRecipients } = req.body

      if (!Array.isArray(incomingRecipients) || incomingRecipients.length === 0) {
        return res.status(400).json({ error: 'Invalid recipients data' })
      }

      // Validate recipients
      const validatedRecipients = incomingRecipients
        .filter((r: any) => r.email && typeof r.email === 'string' && r.email.includes('@'))
        .map((r: any) => {
          const fullName = r.name ? r.name.trim() : ''
          const [firstName, ...lastNameArr] = fullName.split(' ')
          return {
            campaign_id: id,
            email: r.email.toLowerCase().trim(),
            first_name: firstName || '',
            last_name: lastNameArr.join(' ') || '',
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        })

      if (validatedRecipients.length === 0) {
        return res.status(400).json({ error: 'No valid recipients' })
      }

      // Get SERVICE_ROLE_KEY client
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey) {
        return res.status(500).json({ error: 'Server misconfigured: missing SERVICE_ROLE_KEY' })
      }

      const serviceRoleClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      // Get existing emails to skip duplicates
      const { data: existingData } = await serviceRoleClient
        .from('campaign_recipients')
        .select('email')
        .eq('campaign_id', id)

      const existingEmails = new Set(
        (existingData || []).map((r: any) => r.email.toLowerCase().trim())
      )

      const newRecipients = validatedRecipients.filter((r: any) => !existingEmails.has(r.email))
      const duplicateCount = validatedRecipients.length - newRecipients.length

      if (newRecipients.length === 0) {
        return res.status(201).json({
          success: true,
          added: 0,
          message: `All ${duplicateCount} recipients already exist`,
          debug: { duplicatesSkipped: duplicateCount },
        })
      }

      // Insert new recipients
      const { data: insertedData, error: insertError } = await serviceRoleClient
        .from('campaign_recipients')
        .insert(newRecipients)
        .select('id, email, campaign_id')

      if (insertError) {
        console.error('Insert error:', insertError)
        // If duplicate constraint, count what's in DB and return success
        if (insertError.code === '23505') {
          const { count } = await serviceRoleClient
            .from('campaign_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)
          return res.status(201).json({
            success: true,
            added: Math.max(0, (count || 0) - existingEmails.size),
            message: 'Recipients added (some duplicates found)',
            debug: { constraintViolation: true, totalInDb: count },
          })
        }
        throw insertError
      }

      const addedCount = insertedData?.length || 0

      // Update analytics with final count
      const { count: finalCount } = await serviceRoleClient
        .from('campaign_recipients')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)

      await serviceRoleClient
        .from('campaign_analytics')
        .update({
          total_recipients: finalCount || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('campaign_id', id)

      // ===== SINGLE RESPONSE =====
      return res.status(201).json({
        success: true,
        added: addedCount,
        message: `Added ${addedCount} new recipient${addedCount === 1 ? '' : 's'}${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}`,
        debug: {
          totalProvided: validatedRecipients.length,
          added: addedCount,
          duplicates: duplicateCount,
          totalInDatabase: finalCount,
        },
      })
    }

    // ===== DELETE METHOD =====
    if (req.method === 'DELETE') {
      await authenticatedSupabase.from('campaign_recipients').delete().eq('campaign_id', id)

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const srClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
        await srClient.from('campaign_analytics').update({ total_recipients: 0 }).eq('campaign_id', id)
      }

      return res.status(200).json({ success: true, message: 'Recipients deleted' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Recipients endpoint error:', error)
    return res.status(500).json({
      error: 'Server error',
      details: error.message,
    })
  }
}
