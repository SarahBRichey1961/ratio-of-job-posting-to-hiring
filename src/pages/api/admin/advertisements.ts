import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/supabase'

/**
 * Admin endpoint to manage all advertisements
 * GET: List all ads (admin only)
 * DELETE: Remove an ad (admin only)
 * PATCH: Deactivate an ad (admin only)
 * 
 * Restricted to: sarah@websepic.com ONLY
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' })
  }

  // Use service role for reading all ads
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

  // GET: List all advertisements (admin can see all)
  if (req.method === 'GET') {
    try {
      const { data: allAds, error } = await serviceSupabase
        .from('advertisements')
        .select(
          `id, 
           title, 
           description, 
           banner_image_url,
           is_active,
           impressions,
           clicks,
           created_at,
           updated_at,
           advertiser_id,
           advertiser_accounts(company_name, user_id),
           expires_at`
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json({
        success: true,
        admin_user: userEmail,
        total_ads: allAds?.length || 0,
        ads: allAds || [],
      })
    } catch (error: any) {
      console.error('Error fetching ads:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // DELETE: Remove an advertisement
  else if (req.method === 'DELETE') {
    try {
      const { ad_id } = req.body

      if (!ad_id) {
        return res.status(400).json({ error: 'ad_id is required' })
      }

      // Get ad details first
      const { data: adToDelete, error: fetchError } = await serviceSupabase
        .from('advertisements')
        .select('id, title, advertiser_id')
        .eq('id', ad_id)
        .single()

      if (fetchError) throw fetchError

      // Delete the ad
      const { error: deleteError } = await serviceSupabase
        .from('advertisements')
        .delete()
        .eq('id', ad_id)

      if (deleteError) throw deleteError

      return res.status(200).json({
        success: true,
        message: `Ad deleted by admin: "${adToDelete.title}"`,
        deleted_ad_id: ad_id,
        admin_user: userEmail,
      })
    } catch (error: any) {
      console.error('Error deleting ad:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // PATCH: Deactivate an advertisement (soft delete alternative)
  else if (req.method === 'PATCH') {
    try {
      const { ad_id, action } = req.body

      if (!ad_id || !action) {
        return res.status(400).json({ error: 'ad_id and action are required' })
      }

      if (!['deactivate', 'activate'].includes(action)) {
        return res.status(400).json({ error: 'action must be "deactivate" or "activate"' })
      }

      const isActive = action === 'activate'

      // Get ad details first
      const { data: adToUpdate, error: fetchError } = await serviceSupabase
        .from('advertisements')
        .select('id, title, is_active')
        .eq('id', ad_id)
        .single()

      if (fetchError) throw fetchError

      // Update the ad
      const { error: updateError } = await serviceSupabase
        .from('advertisements')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', ad_id)

      if (updateError) throw updateError

      return res.status(200).json({
        success: true,
        message: `Ad ${action}d by admin: "${adToUpdate.title}"`,
        ad_id,
        new_status: isActive ? 'active' : 'inactive',
        admin_user: userEmail,
      })
    } catch (error: any) {
      console.error('Error updating ad:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
