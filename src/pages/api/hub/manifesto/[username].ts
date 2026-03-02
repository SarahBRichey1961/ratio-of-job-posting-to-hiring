import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username or ID required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not initialized' })
    }

    console.log('=== FETCH MANIFESTO ===')
    console.log('Fetching manifesto with username/id:', username)

    // First, try to find in new manifestos table by slug (authenticated users - supports email as slug)
    console.log('Step 1: Checking manifestos table by slug (email or custom username)...')
    const { data: newManifesto, error: newError } = await supabase
      .from('manifestos')
      .select('id, title, content, slug, published, created_at, updated_at, questions_data, meme_image_url')
      .eq('slug', username)
      .eq('published', true)
      .single()

    if (!newError && newManifesto) {
      console.log('Found in manifestos table:', newManifesto.slug)
      const questionsData = newManifesto.questions_data 
        ? (typeof newManifesto.questions_data === 'string' ? JSON.parse(newManifesto.questions_data) : newManifesto.questions_data)
        : []
      return res.status(200).json({
        username: newManifesto.slug,
        title: newManifesto.title || 'Untitled',
        bio: null,
        avatar_url: null,
        manifesto: newManifesto.content,
        questions_data: questionsData,
        updated_at: newManifesto.updated_at,
        isPublished: newManifesto.published,
        isEmail: username.includes('@'),
        meme_image_url: newManifesto.meme_image_url || null,
      })
    }
    console.log('Not found in manifestos:', newError?.message || 'No match')

    // Second, try to find by username in hub_members (authenticated users - legacy)
    console.log('Step 2: Checking hub_members table by username...')
    const { data: authenticatedUser, error: authError } = await supabase
      .from('hub_members')
      .select('username, bio, avatar_url, manifesto, updated_at')
      .eq('username', username)
      .not('manifesto', 'is', null)
      .single()

    if (!authError && authenticatedUser) {
      console.log('Found in hub_members:', authenticatedUser.username)
      return res.status(200).json(authenticatedUser)
    }
    console.log('Not found in hub_members:', authError?.message || 'No match')

    // Third, try to find by ID in public_manifestos (anonymous users - legacy)
    console.log('Step 3: Checking public_manifestos table by id...')
    const { data: anonymousManifesto, error: anonError } = await supabase
      .from('public_manifestos')
      .select('id, content, username, created_at, updated_at, meme_image_url')
      .eq('id', username)
      .single()

    if (!anonError && anonymousManifesto) {
      console.log('Found in public_manifestos:', anonymousManifesto.id)
      return res.status(200).json({
        username: anonymousManifesto.username || 'Anonymous',
        bio: null,
        avatar_url: null,
        manifesto: anonymousManifesto.content,
        updated_at: anonymousManifesto.updated_at,
        isAnonymous: true,
        meme_image_url: anonymousManifesto.meme_image_url || null,
      })
    }
    console.log('Not found in public_manifestos:', anonError?.message || 'No match')

    // Not found in any table
    console.log('Manifesto not found in any table')
    return res.status(404).json({ error: 'Manifesto not found' })
  } catch (error: any) {
    console.error('Error fetching manifesto:', error)
    return res.status(500).json({
      error: error.message || 'Failed to fetch manifesto',
    })
  }
}
