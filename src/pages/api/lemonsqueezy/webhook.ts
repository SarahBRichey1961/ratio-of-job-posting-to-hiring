import { NextApiRequest, NextApiResponse } from 'next'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Read raw body
  let rawBody: string
  try {
    rawBody = await new Promise<string>((resolve, reject) => {
      let data = ''
      req.on('data', (chunk: Buffer) => { data += chunk.toString('utf8') })
      req.on('end', () => resolve(data))
      req.on('error', reject)
    })
  } catch {
    return res.status(400).json({ error: 'Failed to read body' })
  }

  // Verify signature — Lemon Squeezy sends X-Signature as hex HMAC-SHA256
  const signature = req.headers['x-signature'] as string
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' })
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected !== signature) {
    console.error('Invalid Lemon Squeezy webhook signature')
    return res.status(400).json({ error: 'Invalid signature' })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const eventName = event.meta?.event_name as string
  const custom = event.meta?.custom_data as Record<string, string> | undefined
  const userId = custom?.user_id
  const userType = custom?.user_type as 'sponsor' | 'advertiser' | undefined
  const planType = custom?.plan_type as 'monthly' | 'annual' | 'onetime' | undefined

  try {
    switch (eventName) {
      case 'order_created': {
        // One-time payment completed
        if (!userId || !userType) {
          console.error('Missing user_id or user_type in webhook custom data')
          return res.status(400).json({ error: 'Missing custom data' })
        }

        const subscriptionEndDate = getSubscriptionEndDate(planType)
        const orderId = String(event.data?.id || '')

        await upsertAccount(supabase, userId, userType, planType || 'onetime', orderId, subscriptionEndDate)
        console.log(`✓ Order completed for ${userType} (${userId})`)
        break
      }

      case 'subscription_created': {
        if (!userId || !userType) break

        const subscriptionEndDate = getSubscriptionEndDate(planType)
        const subId = String(event.data?.id || '')

        await upsertAccount(supabase, userId, userType, planType || 'monthly', subId, subscriptionEndDate)
        console.log(`✓ Subscription created for ${userType} (${userId})`)
        break
      }

      case 'subscription_updated': {
        const subId = String(event.data?.id || '')
        const status = event.data?.attributes?.status as string
        const renewsAt = event.data?.attributes?.renews_at as string | undefined

        if (userId && userType) {
          const table = userType === 'sponsor' ? 'sponsor_memberships' : 'advertiser_accounts'
          await supabase.from(table).update({
            payment_status: status === 'active' ? 'paid' : status,
            subscription_end_date: renewsAt || null,
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId)
          console.log(`✓ Subscription updated for ${userType} (${userId}): ${status}`)
        }
        break
      }

      case 'subscription_cancelled': {
        if (userId && userType) {
          const table = userType === 'sponsor' ? 'sponsor_memberships' : 'advertiser_accounts'
          await supabase.from(table).update({
            payment_status: 'cancelled',
            updated_at: new Date().toISOString(),
          }).eq('user_id', userId)
          console.log(`✓ Subscription cancelled for ${userType} (${userId})`)
        }
        break
      }

      default:
        console.log(`Unhandled Lemon Squeezy event: ${eventName}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}

function getSubscriptionEndDate(planType?: string): string | null {
  const d = new Date()
  if (planType === 'monthly') {
    d.setMonth(d.getMonth() + 1)
    return d.toISOString()
  }
  if (planType === 'annual') {
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString()
  }
  return null
}

async function upsertAccount(
  supabase: SupabaseClient,
  userId: string,
  userType: 'sponsor' | 'advertiser',
  planType: string,
  paymentId: string,
  subscriptionEndDate: string | null
) {
  if (userType === 'sponsor') {
    const { error } = await supabase.from('sponsor_memberships').upsert({
      user_id: userId,
      is_sponsor: true,
      payment_status: 'paid',
      subscription_type: planType,
      payment_id: paymentId,
      subscription_end_date: subscriptionEndDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
  } else {
    const { error } = await supabase.from('advertiser_accounts').upsert({
      user_id: userId,
      payment_status: 'paid',
      subscription_type: planType,
      payment_id: paymentId,
      subscription_end_date: subscriptionEndDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) throw error
  }
}
