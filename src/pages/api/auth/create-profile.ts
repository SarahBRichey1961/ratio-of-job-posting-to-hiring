import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, email } = req.body

  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email required' })
  }

  try {
    // Use service role for creating the profile (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        role: 'viewer',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ success: true, profile: data })
  } catch (error: any) {
    console.error('Error in create profile endpoint:', error)
    return res.status(500).json({ error: error.message })
  }
}
