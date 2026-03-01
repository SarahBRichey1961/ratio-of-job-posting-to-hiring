import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()
  if (!supabase) {
    return res.status(500).json({ error: 'Database connection failed' })
  }

  try {
    // Get current user from session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userId = session.user.id

    if (req.method === 'GET') {
      // Get all user's manifestos
      const { data, error } = await supabase
        .from('manifestos')
        .select('id, title, slug, content, published, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching manifestos:', error)
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json({ success: true, manifestos: data || [] })
    }

    if (req.method === 'POST') {
      // Create new manifesto
      const { title, content, questions_data, slug } = req.body

      if (!content) {
        return res.status(400).json({ error: 'Content required' })
      }

      // Generate slug if not provided
      const generatedSlug =
        slug || title?.toLowerCase().replace(/\s+/g, '-').slice(0, 50) || `manifesto-${Date.now()}`

      const { data, error } = await supabase
        .from('manifestos')
        .insert({
          user_id: userId,
          title: title || 'Untitled Manifesto',
          content,
          questions_data,
          slug: generatedSlug,
          published: true,
          public_url: `/manifesto/${generatedSlug}`,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating manifesto:', error)
        return res.status(400).json({ error: error.message })
      }

      return res.status(201).json({ success: true, manifesto: data })
    }

    if (req.method === 'PUT') {
      // Update manifesto
      const { id, title, content, questions_data, published } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Manifesto ID required' })
      }

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('manifestos')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existing) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const { data, error } = await supabase
        .from('manifestos')
        .update({
          title: title,
          content: content,
          questions_data: questions_data,
          published: published !== undefined ? published : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating manifesto:', error)
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json({ success: true, manifesto: data })
    }

    if (req.method === 'DELETE') {
      // Delete manifesto
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Manifesto ID required' })
      }

      // Verify ownership
      const { data: existing, error: fetchError } = await supabase
        .from('manifestos')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError || !existing) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      const { error } = await supabase.from('manifestos').delete().eq('id', id).eq('user_id', userId)

      if (error) {
        console.error('Error deleting manifesto:', error)
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Manifesto API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
