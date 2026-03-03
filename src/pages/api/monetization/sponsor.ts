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

      const { is_sponsor, sponsor_name, logo_url, sponsor_tier } = req.body

      // Check if sponsor record already exists
      const { data: existing, error: checkError } = await supabase
        .from('sponsor_memberships')
        .select('id, sponsor_name, logo_url, payment_status, subscription_type')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing sponsor record
        const { data, error } = await supabase
          .from('sponsor_memberships')
          .update({
            is_sponsor,
            sponsor_name: sponsor_name || existing.sponsor_name,
            logo_url: logo_url || existing.logo_url,
            sponsor_tier: sponsor_tier || 'basic',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error
        return res.status(200).json(data)
      } else {
        // Create new sponsor record
        const { data, error } = await supabase
          .from('sponsor_memberships')
          .insert({
            user_id: user.id,
            is_sponsor,
            sponsor_name,
            logo_url,
            sponsor_tier: sponsor_tier || 'basic'
          })
          .select()
          .single()

        if (error) throw error
        return res.status(201).json(data)
      }
    } catch (error) {
      console.error('Error creating sponsor:', error)
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
        .from('sponsor_memberships')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      res.status(200).json(data || null)
    } catch (error) {
      console.error('Error fetching sponsor:', error)
      res.status(500).json({ error: (error as Error).message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
