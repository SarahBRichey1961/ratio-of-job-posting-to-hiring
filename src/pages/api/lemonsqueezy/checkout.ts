import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Lemon Squeezy variant IDs — set these in Netlify environment variables
// Find them: Lemon Squeezy dashboard → Products → click product → Variants → copy Variant ID
const VARIANT_IDS = {
  sponsor: {
    monthly: process.env.LS_SPONSOR_MONTHLY_VARIANT_ID || '',
    annual: process.env.LS_SPONSOR_ANNUAL_VARIANT_ID || '',
    onetime: process.env.LS_SPONSOR_ONETIME_VARIANT_ID || '',
  },
  advertiser: {
    monthly: process.env.LS_ADVERTISER_MONTHLY_VARIANT_ID || '',
    annual: process.env.LS_ADVERTISER_ANNUAL_VARIANT_ID || '',
    onetime: process.env.LS_ADVERTISER_ONETIME_VARIANT_ID || '',
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Payment system not configured' })
  }

  try {
    // Authenticate the user via Supabase
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    )

    const { data: { user }, error: userError } = await authSupabase.auth.getUser()
    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { userType, planType } = req.body as { userType: string; planType: string }

    if (!['sponsor', 'advertiser'].includes(userType) || !['monthly', 'annual', 'onetime'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid userType or planType' })
    }

    const variantId = VARIANT_IDS[userType as 'sponsor' | 'advertiser'][planType as 'monthly' | 'annual' | 'onetime']
    if (!variantId) {
      return res.status(500).json({ error: 'Plan not configured' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://take-the-reins.ai'

    // Create a Lemon Squeezy checkout session
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
                user_type: userType,
                plan_type: planType,
              },
            },
            product_options: {
              redirect_url: `${appUrl}/monetization/success?userType=${userType}`,
            },
            checkout_options: {
              dark: true,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: process.env.LEMONSQUEEZY_STORE_ID || '',
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Lemon Squeezy checkout error:', JSON.stringify(errorData))
      return res.status(500).json({ error: 'Failed to create checkout' })
    }

    const data = await response.json()
    const checkoutUrl = data?.data?.attributes?.url

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'No checkout URL returned' })
    }

    return res.status(200).json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({ error: (error as Error).message })
  }
}
