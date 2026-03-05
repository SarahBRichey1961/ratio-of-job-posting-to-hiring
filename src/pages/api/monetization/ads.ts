import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

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

  // ADMIN BYPASS: Sarah@websepic.com can create unlimited ads without payment
  const isAdmin = user.email === 'Sarah@websepic.com'

  // Get or create advertiser account for this user
  let advertiser: any
  
  const { data: existingAdvertiser, error: getError } = await supabase
    .from('advertiser_accounts')
    .select('id, payment_status, user_id')
    .eq('user_id', user.id)
    .single()

  if (getError && getError.code !== 'PGRST116') {
    // Actual error (not "no rows")
    console.error('Error fetching advertiser:', getError)
    return res.status(500).json({ 
      error: `Failed to fetch advertiser account: ${getError.message}` 
    })
  }

  if (existingAdvertiser) {
    // Account exists
    advertiser = existingAdvertiser
    
    // For non-admins, check payment status
    if (!isAdmin && advertiser.payment_status !== 'paid') {
      return res.status(403).json({ 
        error: `Your advertiser account is ${advertiser.payment_status}. Please complete payment to create ads.` 
      })
    }
  } else {
    // No advertiser account exists
    if (isAdmin || user.email === 'Sarah@websepic.com') {
      // Auto-create for admins with paid status
      const { data: newAdvertiser, error: createError } = await supabase
        .from('advertiser_accounts')
        .insert({
          user_id: user.id,
          company_name: user.email?.split('@')[0] || 'Advertiser',
          contact_email: user.email,
          payment_status: 'paid',
          subscription_type: 'admin'
        })
        .select('id, payment_status, user_id')
        .single()

      if (createError) {
        console.error('Error creating advertiser account:', createError)
        return res.status(500).json({ 
          error: `Failed to create advertiser account: ${createError.message}` 
        })
      }

      advertiser = newAdvertiser
    } else {
      // Non-admin without account
      return res.status(403).json({ 
        error: 'You must be a paid advertiser to create ads. Please purchase an advertising account first.' 
      })
    }
  }

  // Verify advertiser account exists at this point
  if (!advertiser || !advertiser.id) {
    return res.status(500).json({ error: 'Failed to process advertiser account' })
  }

  if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        banner_image_url,
        banner_height,
        click_url,
        alt_text,
        expires_at
      } = req.body

      if (!title || !banner_image_url || !click_url) {
        return res.status(400).json({
          error: 'Title, banner image URL, and click URL are required'
        })
      }

      // Check active ads limit (5 active ads per advertiser)
      const { data: existingAds, error: countError } = await supabase
        .from('advertisements')
        .select('id', { count: 'exact' })
        .eq('advertiser_id', advertiser.id)
        .eq('is_active', true)

      if (countError) throw countError

      const activeAdCount = existingAds?.length || 0
      const AD_LIMIT = 50

      if (activeAdCount >= AD_LIMIT) {
        return res.status(403).json({
          error: `You have reached the limit of ${AD_LIMIT} active ads. Please deactivate or delete existing ads to create new ones.`
        })
      }

      const { data, error } = await supabase
        .from('advertisements')
        .insert({
          advertiser_id: advertiser.id,
          title,
          description,
          banner_image_url,
          banner_height: banner_height || 80,
          click_url,
          alt_text: alt_text || title,
          is_active: true,
          expires_at: expires_at || null
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json(data)
    } catch (error) {
      console.error('Error creating ad:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  } else if (req.method === 'GET') {
    try {
      // Get all ads for this advertiser
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.status(200).json(data)
    } catch (error) {
      console.error('Error fetching ads:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
