import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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

  if (req.method === 'GET') {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Check if advertiser account exists and has paid status
      const { data: advertiser, error } = await supabase
        .from('advertiser_accounts')
        .select('id, payment_status, subscription_type')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      const hasPaidAccount = !!advertiser && advertiser.payment_status === 'paid'

      return res.status(200).json({
        hasPaidAccount,
        advertiser: hasPaidAccount ? advertiser : null
      })
    } catch (error) {
      console.error('Error checking advertiser:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
