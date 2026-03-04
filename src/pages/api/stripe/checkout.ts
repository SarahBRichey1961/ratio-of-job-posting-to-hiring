import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

interface CheckoutRequestBody {
  userType: 'sponsor' | 'advertiser'
  planType: 'monthly' | 'annual' | 'onetime'
}

const PRICING = {
  sponsor: {
    monthly: { amount: 19900, currency: 'usd', interval: 'month' },
    annual: { amount: 199900, currency: 'usd', interval: 'year' },
    onetime: { amount: 49900, currency: 'usd' },
  },
  advertiser: {
    monthly: { amount: 19900, currency: 'usd', interval: 'month' },
    annual: { amount: 199900, currency: 'usd', interval: 'year' },
    onetime: { amount: 49900, currency: 'usd' },
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

    const pricing = PRICING[userType][planType]

    // Use user email as customer identifier
    const customerEmail = user.email || ''

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: planType === 'onetime' ? 'payment' : 'subscription',
      customer_email: customerEmail,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        userType,
        planType,
      },
      payment_method_types: ['card'],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/monetization/success?userType=${userType}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/monetization/pricing`,
    }

    if (planType === 'onetime') {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: pricing.currency as Stripe.Price.CurrencyParam,
            product_data: {
              name: `Take The Reins ${userType === 'sponsor' ? 'Sponsor' : 'Advertiser'} - One-Time Payment`,
              description: `One-time fee for ${userType} account`,
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ]
    } else {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: pricing.currency as Stripe.Price.CurrencyParam,
            product_data: {
              name: `Take The Reins ${userType === 'sponsor' ? 'Sponsor' : 'Advertiser'} - ${planType === 'monthly' ? 'Monthly' : 'Annual'} Plan`,
              description: `Recurring subscription for ${userType} account`,
            },
            unit_amount: pricing.amount,
            recurring: {
              interval: pricing.interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    if (!session.url) {
      throw new Error('Failed to create checkout session')
    }

    return res.status(200).json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: (error as Error).message })
  }
}
