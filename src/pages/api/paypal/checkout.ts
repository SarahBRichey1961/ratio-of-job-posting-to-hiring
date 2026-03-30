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

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`PayPal auth failed (${res.status}): ${errBody}`)
  }
  const data = await res.json()
  return data.access_token
}

// All prices as one-time PayPal orders (no subscription plans needed)
const PRICES: Record<string, Record<string, string>> = {
  sponsor:     { monthly: '199.00', annual: '1999.00', onetime: '499.00' },
  advertiser:  { monthly: '199.00', annual: '1999.00', onetime: '499.00' },
}

const DESCRIPTIONS: Record<string, Record<string, string>> = {
  sponsor: {
    monthly: 'Sponsor membership (1 month) — Take The Reins',
    annual:  'Sponsor membership (1 year) — Take The Reins',
    onetime: 'Sponsor membership (lifetime) — Take The Reins',
  },
  advertiser: {
    monthly: 'Advertiser account (1 month) — Take The Reins',
    annual:  'Advertiser account (1 year) — Take The Reins',
    onetime: 'Advertiser account (lifetime) — Take The Reins',
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.error('[PayPal] PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not configured')
    return res.status(500).json({ error: 'PayPal not configured on server' })
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

    const amount = PRICES[userType]?.[planType]
    if (!amount) return res.status(400).json({ error: 'Invalid userType or planType' })

    const description = DESCRIPTIONS[userType][planType]

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
            description,
            custom_id: `${user.id}|${userType}|${planType}`,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[PayPal] Checkout error:', message)
    return res.status(500).json({ error: message })
  }
}
