import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query as { id: string }
    if (!id) {
      return res.status(400).json({ error: 'Advertiser ID required' })
    }

    // Get auth user
    const authSupabase = getSupabase()
    if (!authSupabase) {
      return res.status(500).json({ error: 'Auth service unavailable' })
    }

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data: { user }, error: userError } = await authSupabase.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await authSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get advertiser details
    const { data: advertiser, error: getError } = await authSupabase
      .from('advertiser_accounts')
      .select(`
        id,
        user_id,
        company_name,
        website,
        contact_email,
        payment_status,
        subscription_type,
        subscription_end_date,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single()

    if (getError || !advertiser) {
      return res.status(404).json({ error: 'Advertiser not found' })
    }

    // Get user email from auth
    const { data: { users }, error: usersError } = await authSupabase.auth.admin.listUsers()
    const advertiserUser = users?.find(u => u.id === advertiser.user_id)

    // Get ads for this advertiser
    const { data: ads, error: adsError } = await authSupabase
      .from('advertisements')
      .select('id, title, is_active, impressions, clicks, created_at')
      .eq('advertiser_id', id)
      .order('created_at', { ascending: false })

    if (req.method === 'GET') {
      return res.status(200).json({
        ...advertiser,
        advertiser_email: advertiserUser?.email,
        ads: ads || [],
        ad_count: ads?.length || 0
      })
    }

    if (req.method === 'PUT') {
      const { company_name, website, contact_email, payment_status } = req.body

      // Update advertiser account
      const { data: updated, error: updateError } = await authSupabase
        .from('advertiser_accounts')
        .update({
          company_name: company_name || advertiser.company_name,
          website: website || advertiser.website,
          contact_email: contact_email || advertiser.contact_email,
          payment_status: payment_status || advertiser.payment_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating advertiser:', updateError)
        return res.status(500).json({ error: 'Failed to update advertiser' })
      }

      return res.status(200).json({
        message: 'Advertiser updated successfully',
        advertiser: updated
      })
    }
  } catch (error) {
    console.error('Error in admin advertiser detail endpoint:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
