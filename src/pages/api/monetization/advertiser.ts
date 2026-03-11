import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  if (req.method === 'POST') {
    try {
      // Get auth token
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)

      // Extract user ID from token
      const userId = getUserIdFromToken(token)
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const { company_name, website, contact_email } = req.body

      // Check if advertiser account already exists
      const { data: existing, error: checkError } = await supabase
        .from('advertiser_accounts')
        .select('id, website, contact_email, payment_status, subscription_type')
        .eq('user_id', userId)
        .single()

      // Handle errors from checking for existing account
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine for creation
        console.error('Error checking for existing advertiser:', checkError)
        throw new Error(`Failed to check advertiser account: ${checkError.message}`)
      }

      if (existing) {
        // Update existing advertiser account if company_name provided
        if (company_name) {
          const { data, error } = await supabase
            .from('advertiser_accounts')
            .update({
              company_name,
              website: website || existing.website,
              contact_email: contact_email || existing.contact_email,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .single()

          if (error) {
            console.error('Error updating advertiser:', error)
            throw new Error(`Failed to update advertiser: ${error.message}`)
          }
          return res.status(200).json(data)
        }
        // Just return existing account if no company_name provided
        return res.status(200).json({ id: existing.id, created: false })
      } else {
        // Create new advertiser account (company_name is optional now)
        if (!userId) {
          throw new Error('User ID is missing - cannot create advertiser account')
        }
        
        const { data, error } = await supabase
          .from('advertiser_accounts')
          .insert({
            user_id: userId,
            company_name: company_name || null,
            website: website || null,
            contact_email: contact_email || null
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating advertiser:', error)
          throw new Error(`Failed to create advertiser account: ${error.message}`)
        }
        return res.status(201).json({ ...data, created: true })
      }
    } catch (error) {
      console.error('Error creating advertiser:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  } else if (req.method === 'GET') {
    try {
      // Get authenticated user
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const token = authHeader.substring(7)
      const userId = getUserIdFromToken(token)
      if (!userId) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const { data, error } = await supabase
        .from('advertiser_accounts')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return res.status(200).json(data || null)
    } catch (error) {
      console.error('Error fetching advertiser:', error)
      return res.status(500).json({ error: (error as Error).message })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
