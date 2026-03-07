import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, getAuthenticatedSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const authenticatedSupabase = getAuthenticatedSupabase(token)
    const { data: { user } } = await authenticatedSupabase.auth.getUser()

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const supabase = getSupabase()

    // Verify campaign ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('id, creator_id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign || campaign.creator_id !== user.id) {
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
        .map((r: any) => ({
          campaign_id: id,
          email: r.email.toLowerCase(),
          name: r.name || '',
          status: 'pending',
          created_at: new Date().toISOString(),
        }))

      if (validatedRecipients.length === 0) {
        return res.status(400).json({ error: 'No valid recipients provided' })
      }

      // Insert recipients (skip duplicates)
      const { data, error } = await supabase
        .from('campaign_recipients')
        .insert(validatedRecipients)
        .select()

      if (error && error.code !== '23505') {
        // 23505 is unique constraint violation (duplicate)
        throw error
      }

      res.status(201).json({
        success: true,
        added: data?.length || validatedRecipients.length,
        message: `Added ${validatedRecipients.length} recipients to campaign`,
      })
    } else if (req.method === 'DELETE') {
      // Delete all recipients for campaign
      const { error } = await supabase
        .from('campaign_recipients')
        .delete()
        .eq('campaign_id', id)

      if (error) throw error

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
