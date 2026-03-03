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

      if (!company_name) {
        return res.status(400).json({ error: 'Company name is required' })
      }

      // Check if advertiser account already exists
      const { data: existing } = await supabase
        .from('advertiser_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing advertiser account
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
      } else {
        // Create new advertiser account
        const { data, error } = await supabase
          .from('advertiser_accounts')
          .insert({
            user_id: user.id,
            company_name,
            website,
            contact_email: contact_email || user.email
          })
          .select()
          .single()

        if (error) throw error
        return res.status(201).json(data)
      }
    } catch (error) {
      console.error('Error creating advertiser:', error)
      res.status(500).json({ error: (error as Error).message })
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

      res.status(200).json(data || null)
    } catch (error) {
      console.error('Error fetching advertiser:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
