import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface CheckoutRequestBody {
  userType: 'sponsor' | 'advertiser'
  planType: 'monthly' | 'annual' | 'onetime'
}

// Paddle Product and Price IDs (you'll need to replace these with actual Paddle IDs)
// Format: priceId from your Paddle dashboard
const PADDLE_PRICING = {
  sponsor: {
    monthly: process.env.PADDLE_SPONSOR_MONTHLY_PRICE_ID || 'PRC_SPONSOR_MONTHLY',
    annual: process.env.PADDLE_SPONSOR_ANNUAL_PRICE_ID || 'PRC_SPONSOR_ANNUAL',
    onetime: process.env.PADDLE_SPONSOR_ONETIME_PRICE_ID || 'PRC_SPONSOR_ONETIME',
  },
  advertiser: {
    monthly: process.env.PADDLE_ADVERTISER_MONTHLY_PRICE_ID || 'PRC_ADVERTISER_MONTHLY',
    annual: process.env.PADDLE_ADVERTISER_ANNUAL_PRICE_ID || 'PRC_ADVERTISER_ANNUAL',
    onetime: process.env.PADDLE_ADVERTISER_ONETIME_PRICE_ID || 'PRC_ADVERTISER_ONETIME',
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const authSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

    // Get authenticated user
    const { data: { user }, error: userError } = await authSupabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { userType, planType } = req.body as CheckoutRequestBody

    if (!userType || !planType) {
      return res.status(400).json({ error: 'Missing userType or planType' })
    }

    if (!['sponsor', 'advertiser'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid userType' })
    }

    if (!['monthly', 'annual', 'onetime'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid planType' })
    }

    const paddleApiKey = process.env.PADDLE_API_KEY
    if (!paddleApiKey) {
      throw new Error('PADDLE_API_KEY not configured')
    }

    // Get the price ID from Paddle pricing map
    const priceId = PADDLE_PRICING[userType][planType]

    // Create checkout session via Paddle API
    const checkoutResponse = await fetch('https://api.paddle.com/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paddleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer_email: user.email,
        custom_data: {
          userId: user.id,
          userType: userType,
          planType: planType,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/monetization/success?userType=${userType}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      }),
    })

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json()
      console.error('Paddle checkout error:', errorData)
      throw new Error(`Failed to create Paddle checkout: ${errorData.error?.message || 'Unknown error'}`)
    }

    const checkoutData = await checkoutResponse.json()

    if (!checkoutData.data?.url) {
      throw new Error('Paddle checkout URL not returned')
    }

    return res.status(200).json({ 
      url: checkoutData.data.url,
      checkoutId: checkoutData.data.id,
    })
  } catch (error) {
    console.error('Paddle checkout error:', error)
    res.status(500).json({ error: (error as Error).message })
  }
}
