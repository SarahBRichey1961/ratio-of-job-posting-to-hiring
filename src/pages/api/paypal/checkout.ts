import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('Failed to get PayPal access token')
  const data = await res.json()
  return data.access_token
}

// Prices in USD
const ONETIME_PRICE: Record<string, string> = {
  sponsor: '499.00',
  advertiser: '499.00',
}

// Pre-created PayPal subscription plan IDs (set in Netlify env vars)
const PLAN_IDS: Record<string, Record<string, string | undefined>> = {
  sponsor: {
    monthly: process.env.PAYPAL_SPONSOR_MONTHLY_PLAN_ID,
    annual: process.env.PAYPAL_SPONSOR_ANNUAL_PLAN_ID,
  },
  advertiser: {
    monthly: process.env.PAYPAL_ADVERTISER_MONTHLY_PLAN_ID,
    annual: process.env.PAYPAL_ADVERTISER_ANNUAL_PLAN_ID,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.slice(7)
  )
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { userType, planType } = req.body as {
    userType: 'sponsor' | 'advertiser'
    planType: 'monthly' | 'annual' | 'onetime'
  }

  if (!userType || !planType) {
    return res.status(400).json({ error: 'Missing userType or planType' })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://takethereins.com'
  const returnUrl = `${baseUrl}/monetization/checkout/success?userType=${userType}&planType=${planType}`
  const cancelUrl = `${baseUrl}/monetization/pricing`

  try {
    const accessToken = await getAccessToken()

    if (planType === 'onetime') {
      const amount = ONETIME_PRICE[userType]
      if (!amount) return res.status(400).json({ error: 'Invalid userType' })

      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: { currency_code: 'USD', value: amount },
              description: `${userType} one-time access — Take The Reins`,
              custom_id: `${user.id}|${userType}|onetime`,
            },
          ],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            brand_name: 'Take The Reins',
            user_action: 'PAY_NOW',
          },
        }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json()
        console.error('[PayPal] Order creation error:', err)
        return res.status(502).json({ error: 'Failed to create PayPal order' })
      }

      const order = await orderRes.json()
      const approveLink = order.links?.find(
        (l: { rel: string }) => l.rel === 'approve'
      )?.href

      if (!approveLink) {
        return res.status(502).json({ error: 'No PayPal approval URL returned' })
      }

      return res.status(200).json({ url: approveLink })
    } else {
      // monthly or annual — use pre-created subscription plan
      const planId = PLAN_IDS[userType]?.[planType]
      if (!planId) {
        return res.status(400).json({
          error: `PayPal plan not configured for ${userType} ${planType}. Set PAYPAL_${userType.toUpperCase()}_${planType.toUpperCase()}_PLAN_ID in env.`,
        })
      }

      const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: `${user.id}|${userType}|${planType}`,
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            brand_name: 'Take The Reins',
            user_action: 'SUBSCRIBE_NOW',
          },
        }),
      })

      if (!subRes.ok) {
        const err = await subRes.json()
        console.error('[PayPal] Subscription creation error:', err)
        return res.status(502).json({ error: 'Failed to create PayPal subscription' })
      }

      const sub = await subRes.json()
      const approveLink = sub.links?.find(
        (l: { rel: string }) => l.rel === 'approve'
      )?.href

      if (!approveLink) {
        return res.status(502).json({ error: 'No PayPal approval URL returned' })
      }

      return res.status(200).json({ url: approveLink })
    }
  } catch (err) {
    console.error('[PayPal] Checkout error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
