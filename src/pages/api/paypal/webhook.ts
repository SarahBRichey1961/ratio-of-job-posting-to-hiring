import { NextApiRequest, NextApiResponse } from 'next'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false },
}

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

async function verifyWebhook(req: NextApiRequest, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.warn('[PayPal] PAYPAL_WEBHOOK_ID not set — skipping verification')
    return false
  }

  try {
    const accessToken = await getAccessToken()
    const verifyRes = await fetch(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: req.headers['paypal-auth-algo'],
          cert_url: req.headers['paypal-cert-url'],
          transmission_id: req.headers['paypal-transmission-id'],
          transmission_sig: req.headers['paypal-transmission-sig'],
          transmission_time: req.headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      }
    )

    const result = await verifyRes.json()
    return result.verification_status === 'SUCCESS'
  } catch (err) {
    console.error('[PayPal] Webhook verification error:', err)
    return false
  }
}

async function upsertAccount(
  supabase: SupabaseClient,
  userId: string,
  userType: 'sponsor' | 'advertiser',
  planType: string,
  paymentId: string,
  subscriptionEndDate: string | null
) {
  const record = {
    user_id: userId,
    payment_status: 'paid',
    subscription_type: planType,
    paddle_checkout_id: paymentId,
    subscription_end_date: subscriptionEndDate,
    updated_at: new Date().toISOString(),
  }

  if (userType === 'sponsor') {
    const { error } = await supabase
      .from('sponsor_memberships')
      .upsert({ ...record, is_sponsor: true }, { onConflict: 'user_id' })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('advertiser_accounts')
      .upsert({ ...record, is_active: true }, { onConflict: 'user_id' })
    if (error) throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const rawBody = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    // @ts-ignore - Buffer concat type compatibility issue with @types/node
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

  const verified = await verifyWebhook(req, rawBody)
  if (!verified) {
    console.error('[PayPal] Webhook verification failed')
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  const event = JSON.parse(rawBody)
  const eventType = event.event_type as string

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource
        const customId = resource.custom_id as string | undefined
        if (!customId) break
        const [userId, userType, planType] = customId.split('|')
        if (!userId || !userType) break
        await upsertAccount(
          supabase,
          userId,
          userType as 'sponsor' | 'advertiser',
          planType || 'onetime',
          resource.id,
          null
        )
        console.log(`[PayPal] ✓ Payment captured for ${userType} (${userId})`)
        break
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const resource = event.resource
        const customId = resource.custom_id as string | undefined
        if (!customId) break
        const [userId, userType, planType] = customId.split('|')
        if (!userId || !userType) break
        const endDate = resource.billing_info?.next_billing_time || null
        await upsertAccount(
          supabase,
          userId,
          userType as 'sponsor' | 'advertiser',
          planType || 'monthly',
          resource.id,
          endDate
        )
        console.log(`[PayPal] ✓ Subscription ${eventType} for ${userType} (${userId})`)
        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const resource = event.resource
        const customId = resource.custom_id as string | undefined
        if (!customId) break
        const [userId, userType] = customId.split('|')
        if (!userId || !userType) break

        if (userType === 'sponsor') {
          await supabase
            .from('sponsor_memberships')
            .update({ payment_status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
        } else {
          await supabase
            .from('advertiser_accounts')
            .update({
              payment_status: 'cancelled',
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        console.log(`[PayPal] ✓ Subscription cancelled for ${userType} (${userId})`)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[PayPal] Webhook processing error:', err)
    return res.status(500).json({ error: 'Processing failed' })
  }

  return res.status(200).json({ received: true })
}
