import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseAdminKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseAdminKey)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const metadata = session.metadata || {}
        const userType = metadata.userType as 'sponsor' | 'advertiser'
        const planType = metadata.planType as 'monthly' | 'annual' | 'onetime'

        if (!userId || !userType) {
          console.error('Missing userId or userType in metadata')
          return res.status(400).json({ error: 'Invalid metadata' })
        }

        // Determine subscription end date
        let subscriptionEndDate = null
        if (planType === 'monthly') {
          subscriptionEndDate = new Date()
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)
        } else if (planType === 'annual') {
          subscriptionEndDate = new Date()
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1)
        } else {
          // One-time payment - no expiration
          subscriptionEndDate = null
        }

        // Update sponsor or advertiser record
        if (userType === 'sponsor') {
          const { error } = await supabase
            .from('sponsor_memberships')
            .update({
              is_sponsor: true,
              payment_status: 'paid',
              subscription_type: planType,
              stripe_session_id: session.id,
              subscription_end_date: subscriptionEndDate?.toISOString() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

          if (error) {
            console.error('Error updating sponsor:', error)
            throw error
          }
        } else if (userType === 'advertiser') {
          const { error } = await supabase
            .from('advertiser_accounts')
            .update({
              payment_status: 'paid',
              subscription_type: planType,
              stripe_session_id: session.id,
              subscription_end_date: subscriptionEndDate?.toISOString() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

          if (error) {
            console.error('Error updating advertiser:', error)
            throw error
          }
        }

        console.log(`Payment confirmed for ${userType} (${userId})`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log(`Subscription cancelled: ${customerId}`)
        // Handle subscription cancellation if needed
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log(`Charge refunded: ${charge.id}`)
        // Handle refunds if needed
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: (error as Error).message })
  }
}
