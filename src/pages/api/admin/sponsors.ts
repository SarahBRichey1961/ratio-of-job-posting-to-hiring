import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/supabase'

/**
 * Admin endpoint to manage sponsors
 * GET: List all sponsors with their details (admin only)
 * 
 * Restricted to: sarah@websepic.com ONLY
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' })
  }

  // Use service role for reading all sponsors
  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get auth token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - no token' })
  }

  const token = authHeader.substring(7)

  // Extract user ID from token
  const userId = getUserIdFromToken(token)
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Verify user is Sarah (ADMIN ONLY)
  const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(userId)

  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Failed to verify user' })
  }

  const userEmail = userData.user.email

  // STRICT ADMIN CHECK - Only sarah@websepic.com
  if (userEmail !== 'sarah@websepic.com') {
    return res.status(403).json({
      error: `Access denied. Admin access restricted to sarah@websepic.com. Your email: ${userEmail}`,
    })
  }

  // GET: List all sponsors (admin can see all)
  if (req.method === 'GET') {
    try {
      // Get all sponsors with their user details
      const { data: sponsors, error: sponsorsError } = await serviceSupabase
        .from('sponsor_memberships')
        .select('*')
        .eq('is_sponsor', true)
        .order('created_at', { ascending: false })

      if (sponsorsError) throw sponsorsError

      // Get user details for each sponsor
      const sponsorsWithDetails = await Promise.all(
        (sponsors || []).map(async (sponsor) => {
          try {
            const { data: user } = await serviceSupabase.auth.admin.getUserById(sponsor.user_id)
            return {
              ...sponsor,
              user_email: user?.user?.email || 'Unknown',
              user_created_at: user?.user?.created_at || null,
            }
          } catch (err) {
            return {
              ...sponsor,
              user_email: 'Error fetching',
              user_created_at: null,
            }
          }
        })
      )

      return res.status(200).json({
        success: true,
        admin_user: userEmail,
        total_sponsors: sponsorsWithDetails?.length || 0,
        sponsors: sponsorsWithDetails || [],
      })
    } catch (error: any) {
      console.error('Error fetching sponsors:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // PATCH: Update sponsor payment status (if needed)
  else if (req.method === 'PATCH') {
    try {
      const { sponsor_id, is_sponsor } = req.body

      if (!sponsor_id) {
        return res.status(400).json({ error: 'sponsor_id is required' })
      }

      const { error: updateError } = await serviceSupabase
        .from('sponsor_memberships')
        .update({
          is_sponsor: is_sponsor !== undefined ? is_sponsor : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sponsor_id)

      if (updateError) throw updateError

      return res.status(200).json({
        success: true,
        message: `Sponsor updated successfully`,
        sponsor_id,
      })
    } catch (error: any) {
      console.error('Error updating sponsor:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
