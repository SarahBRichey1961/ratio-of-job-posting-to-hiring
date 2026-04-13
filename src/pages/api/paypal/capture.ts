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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId } = req.body as { orderId: string }
  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId' })
  }

  try {
    const accessToken = await getAccessToken()

    // Fetch the order to get custom_id (contains userId and userType)
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!orderRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch order details' })
    }

    const order = await orderRes.json()

    // Capture the payment
    const captureRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!captureRes.ok) {
      const err = await captureRes.json()
      console.error('[PayPal] Capture error:', err)
      return res.status(502).json({ error: 'Payment capture failed' })
    }

    const capture = await captureRes.json()
    const captureId =
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId
    const customId = order.purchase_units?.[0]?.custom_id as string | undefined

    if (customId) {
      const [userId, userType, planType] = customId.split('|')

      if (userId && userType) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Calculate end date based on plan type
        let endDate: string | null = null
        if (planType === 'monthly') {
          const d = new Date(); d.setMonth(d.getMonth() + 1)
          endDate = d.toISOString()
        } else if (planType === 'annual') {
          const d = new Date(); d.setFullYear(d.getFullYear() + 1)
          endDate = d.toISOString()
        }

        const record = {
          user_id: userId,
          payment_status: 'paid',
          subscription_type: planType || 'onetime',
          payment_id: captureId,
          subscription_end_date: endDate,
          updated_at: new Date().toISOString(),
        }

        if (userType === 'sponsor') {
          await supabase
            .from('sponsor_memberships')
            .upsert({ ...record, is_sponsor: true }, { onConflict: 'user_id' })
        } else {
          await supabase
            .from('advertiser_accounts')
            .upsert({ ...record, is_active: true }, { onConflict: 'user_id' })
        }

        console.log(`[PayPal] ✓ Order captured for ${userType} (${userId})`)
      }
    }

    return res.status(200).json({ status: 'captured' })
  } catch (err) {
    console.error('[PayPal] Capture error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
