import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// This endpoint manually validates and sets payment status for admins
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)

    // Create authenticated client
    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    // Get authenticated user
    const { data: { user }, error: userError } = await authSupabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Only admins can validate payments
    if (user.email !== 'Sarah@websepic.com') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    // Find user by email
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .limit(1)

    if (profileError || !profiles || profiles.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userId = profiles[0].id

    // Get or create advertiser account
    const { data: existing, error: existingError } = await supabase
      .from('advertiser_accounts')
      .select('id, payment_status')
      .eq('user_id', userId)
      .single()

    if (!existing && existingError?.code === 'PGRST116') {
      // Account doesn't exist, create it
      const { data: created, error: createError } = await supabase
        .from('advertiser_accounts')
        .insert({
          user_id: userId,
          company_name: email.split('@')[0],
          contact_email: email,
          payment_status: 'paid',
          subscription_type: 'premium'
        })
        .select()
        .single()

      if (createError) {
        return res.status(500).json({ 
          error: 'Failed to create advertiser account',
          details: createError.message 
        })
      }

      return res.status(200).json({
        success: true,
        message: `Created advertiser account for ${email} with PAID status`,
        account: created
      })
    }

    if (existingError) {
      return res.status(500).json({ 
        error: 'Failed to fetch advertiser account',
        details: existingError.message 
      })
    }

    // Update payment_status to paid
    const { data: updated, error: updateError } = await supabase
      .from('advertiser_accounts')
      .update({ 
        payment_status: 'paid',
        subscription_type: 'premium',
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update payment status',
        details: updateError.message 
      })
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${email} payment_status: ${existing.payment_status} → PAID ✅`,
      previousStatus: existing.payment_status,
      newStatus: 'paid',
      account: updated
    })

  } catch (error) {
    console.error('Error in validate-payment:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: (error as Error).message 
    })
  }
}
