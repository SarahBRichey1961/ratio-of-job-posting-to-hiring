import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: false, // Must be false to get raw body for HMAC signature verification
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const paddleWebhookSecret = process.env.PADDLE_WEBHOOK_SECRET || ''

  if (!paddleWebhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Read raw body as buffer (required for correct HMAC)
  let rawBody: string
  try {
    rawBody = await new Promise<string>((resolve, reject) => {
      let data = ''
      req.on('data', (chunk: Buffer) => { data += chunk.toString('utf8') })
      req.on('end', () => resolve(data))
      req.on('error', reject)
    })
  } catch (e) {
    console.error('Failed to read request body:', e)
    return res.status(400).json({ error: 'Failed to read body' })
  }

  // Parse raw body for event processing
  let parsedBody: any
  try {
    parsedBody = JSON.parse(rawBody)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  try {
    // Verify Paddle webhook signature
    // Paddle v2 format: 'ts=1671552777;h1=<hex_hash>'
    const signatureHeader = req.headers['paddle-signature'] as string
    if (!signatureHeader) {
      console.error('Missing Paddle-Signature header')
      return res.status(400).json({ error: 'Missing signature' })
    }

    const parts = Object.fromEntries(
      signatureHeader.split(';').map(part => part.split('=') as [string, string])
    )
    const ts = parts['ts']
    const h1 = parts['h1']

    if (!ts || !h1) {
      console.error('Invalid Paddle-Signature format:', signatureHeader)
      return res.status(400).json({ error: 'Invalid signature format' })
    }

    const signedPayload = `${ts}:${rawBody}`
    const computedHash = crypto
      .createHmac('sha256', paddleWebhookSecret)
      .update(signedPayload)
      .digest('hex')

    if (computedHash !== h1) {
      console.error('Invalid Paddle webhook signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseAdminKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseAdminKey)

    const event = parsedBody

    try {
      switch (event.event_type) {
        case 'checkout.completed': {
          const checkout = event.data
          const customData = checkout.custom_data || {}
          const userId = customData.userId
          const userType = customData.userType as 'sponsor' | 'advertiser' | undefined
          const planType = customData.planType as 'monthly' | 'annual' | 'onetime' | undefined

          if (!userId || !userType) {
            console.error('Missing userId or userType in custom_data')
            return res.status(400).json({ error: 'Invalid checkout data' })
          }

          // Determine subscription end date
          let subscriptionEndDate = null
          if (planType === 'monthly') {
            subscriptionEndDate = new Date()
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
          } else if (planType === 'annual') {
            subscriptionEndDate = new Date()
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
          }

          // Update sponsor or advertiser record
          if (userType === 'sponsor') {
            const { error } = await supabase
              .from('sponsor_memberships')
              .update({
                is_sponsor: true,
                payment_status: 'paid',
                subscription_type: planType,
                paddle_checkout_id: checkout.id,
                subscription_end_date: subscriptionEndDate?.toISOString() || null,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)

            if (error) {
              console.error('Error updating sponsor:', error)
              throw error
            }
          } else if (userType === 'advertiser') {
            // First, try to get existing advertiser account
            const { data: existing } = await supabase
              .from('advertiser_accounts')
              .select('id')
              .eq('user_id', userId)
              .single()

            if (!existing) {
              // Create new advertiser account
              const { error: createError } = await supabase
                .from('advertiser_accounts')
                .insert({
                  user_id: userId,
                  payment_status: 'paid',
                  subscription_type: planType,
                  paddle_checkout_id: checkout.id,
                  subscription_end_date: subscriptionEndDate?.toISOString() || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })

              if (createError) {
                console.error('Error creating advertiser account:', createError)
                throw createError
              }
            } else {
              // Update existing advertiser account
              const { error: updateError } = await supabase
                .from('advertiser_accounts')
                .update({
                  payment_status: 'paid',
                  subscription_type: planType,
                  paddle_checkout_id: checkout.id,
                  subscription_end_date: subscriptionEndDate?.toISOString() || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)

              if (updateError) {
                console.error('Error updating advertiser:', updateError)
                throw updateError
              }
            }
          }

          console.log(`✓ Payment completed for ${userType} (${userId}) via Paddle`)
          break
        }

        case 'subscription.created': {
          const subscription = event.data
          console.log(`✓ Subscription created: ${subscription.id}`)
          // Additional subscription tracking if needed
          break
        }

        case 'subscription.updated': {
          const subscription = event.data
          console.log(`✓ Subscription updated: ${subscription.id}`)
          // Handle subscription updates (renewal, tier change, etc.)
          break
        }

        case 'subscription.canceled': {
          const subscription = event.data
          console.log(`✓ Subscription cancelled: ${subscription.id}`)
          // Update subscription status in database if needed
          break
        }

        case 'transaction.completed': {
          const transaction = event.data
          console.log(`✓ Transaction completed: ${transaction.id}`)
          // Update payment records if needed
          break
        }

        case 'transaction.refunded': {
          const transaction = event.data
          console.log(`✓ Transaction refunded: ${transaction.id}`)
          // Handle refunds (may need to revoke access)
          break
        }

        default:
          console.log(`Received unhandled Paddle event: ${event.event_type}`)
      }
    } catch (error) {
      console.error('Error processing Paddle webhook:', error)
      // Return 200 to acknowledge receipt, but log the error
      return res.status(200).json({ error: (error as Error).message })
    }

    // Return 200 to acknowledge webhook receipt
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Paddle webhook error:', error)
    res.status(500).json({ error: (error as Error).message })
  }
}
