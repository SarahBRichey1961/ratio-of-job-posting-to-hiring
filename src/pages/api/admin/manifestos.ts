import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Service role client for data queries and admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' })
    }

    const token = authHeader.slice(7)

    // Validate token by creating a user-context client with the access token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !userData.user) {
      console.error('[admin/manifestos] Token validation error:', userError?.message)
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userEmail = userData.user.email

    // Strict admin check
    if (userEmail !== 'sarah@websepic.com') {
      return res.status(403).json({
        error: `Access denied. Admin access restricted to sarah@websepic.com. Your email: ${userEmail}`,
      })
    }

    // Fetch all published manifestos with user email
    const { data, error } = await supabaseAdmin
      .from('manifestos')
      .select(
        `
        id,
        user_id,
        title,
        slug,
        public_url,
        published,
        created_at,
        updated_at
      `
      )
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching manifestos:', error)
      return res.status(400).json({ error: error.message })
    }

    // Get user emails for each manifesto
    const manifestosWithEmails = []

    for (const manifesto of data || []) {
      // Get user email from auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(manifesto.user_id)

      if (!authError && authUser?.user?.email) {
        manifestosWithEmails.push({
          ...manifesto,
          user_email: authUser.user.email,
        })
      }
    }

    return res.status(200).json({
      admin_user: userEmail,
      total_manifestos: manifestosWithEmails.length,
      manifestos: manifestosWithEmails,
    })
  } catch (err) {
    console.error('Admin manifestos error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
