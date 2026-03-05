import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Admin Debug Endpoint - Check and setup Sarah's advertiser account
 * POST: Creates advertiser account for Sarah if it doesn't exist
 * GET: Shows Sarah's account status
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // IMPORTANT: This endpoint checks Sarah's account by hardcoded email
    // Only use for debugging/setup purposes
    const SARAH_EMAIL = 'sarah@websepic.com'

    // Find Sarah's user ID by email
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .eq('email', SARAH_EMAIL)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Sarah profile not found',
        details: profileError?.message,
        sarahEmail: SARAH_EMAIL,
        action: 'Check if user exists in user_profiles table'
      })
    }

    const userId = profile.id

    if (req.method === 'GET') {
      // Check Sarah's advertiser account status
      const { data: account, error: accountError } = await supabase
        .from('advertiser_accounts')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (accountError && accountError.code === 'PGRST116') {
        return res.status(200).json({
          status: 'no_account',
          message: 'Sarah does not have an advertiser account yet',
          sarahProfile: profile,
          action: 'POST to this endpoint to create one'
        })
      }

      if (accountError) {
        return res.status(500).json({
          error: 'Error checking account',
          details: accountError.message
        })
      }

      return res.status(200).json({
        status: 'account_exists',
        profile,
        account,
        paymentStatus: account.payment_status,
        subscriptionType: account.subscription_type
      })
    } else if (req.method === 'POST') {
      // Create or update Sarah's advertiser account
      const { data: existing } = await supabase
        .from('advertiser_accounts')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existing) {
        // Update existing to ensure it's paid
        const { data: updated, error: updateError } = await supabase
          .from('advertiser_accounts')
          .update({
            payment_status: 'paid',
            subscription_type: 'premium',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) {
          return res.status(500).json({
            error: 'Failed to update account',
            details: updateError.message
          })
        }

        return res.status(200).json({
          status: 'account_updated',
          message: 'Sarah advertiser account updated to PAID status',
          account: updated,
          userId,
          sarahEmail: SARAH_EMAIL
        })
      } else {
        // Create new account
        const { data: created, error: createError } = await supabase
          .from('advertiser_accounts')
          .insert({
            user_id: userId,
            company_name: 'Sarah Web Epic',
            website: 'https://websepic.com',
            contact_email: SARAH_EMAIL,
            payment_status: 'paid',
            subscription_type: 'premium'
          })
          .select()
          .single()

        if (createError) {
          return res.status(500).json({
            error: 'Failed to create account',
            details: createError.message,
            code: createError.code
          })
        }

        return res.status(201).json({
          status: 'account_created',
          message: 'Sarah advertiser account created with PAID status',
          account: created,
          userId,
          sarahEmail: SARAH_EMAIL
        })
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' })
    }
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return res.status(500).json({
      error: 'Unexpected error',
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
  }
}
