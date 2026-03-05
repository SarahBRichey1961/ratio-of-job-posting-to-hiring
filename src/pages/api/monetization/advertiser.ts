import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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

      // Create authenticated client
      const authSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })

      // Get authenticated user
      const { data: { user }, error: userError } = await authSupabase.auth.getUser()
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { company_name, website, contact_email } = req.body

      // Check if advertiser account already exists
      const { data: existing } = await supabase
        .from('advertiser_accounts')
        .select('id, website, contact_email, payment_status, subscription_type')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing advertiser account if company_name provided
        if (company_name) {
          const { data, error } = await supabase
            .from('advertiser_accounts')
            .update({
              company_name,
              website: website || existing.website,
              contact_email: contact_email || user.email,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single()

          if (error) throw error
          return res.status(200).json(data)
        }
        // Just return existing account if no company_name provided
        return res.status(200).json({ id: existing.id, created: false })
      } else {
        // Create new advertiser account (company_name is optional now)
        const { data, error } = await supabase
          .from('advertiser_accounts')
          .insert({
            user_id: user.id,
            company_name: company_name || null,
            website: website || null,
            contact_email: contact_email || user.email
          })
          .select()
          .single()

        if (error) throw error
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
      const authSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })

      const { data: { user }, error: userError } = await authSupabase.auth.getUser()
      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { data, error } = await supabase
        .from('advertiser_accounts')
        .select('*')
        .eq('user_id', user.id)
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
