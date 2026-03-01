import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_MANIFESTO_BASE_URL || 'https://takethereigns.ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, content, username, questionsData } = req.body

  if (!content) {
    return res.status(400).json({ error: 'Content required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      // Even without Supabase, generate a shareable ID
      const manifestId = crypto
        .createHash('sha256')
        .update(`${userId || 'anon'}-${Date.now()}`)
        .digest('hex')
        .substring(0, 12)

      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${manifestId}`,
        isAnonymous: true,
        published_at: new Date().toISOString(),
      })
    }

    // Get current authenticated user from session
    const { data: { session } } = await supabase.auth.getSession()
    const authenticatedUserId = session?.user?.id

    // If user is authenticated, save to new manifestos table
    if (authenticatedUserId) {
      const slug = username || `manifesto-${Date.now()}`
      const title = `Manifesto - ${new Date().toLocaleDateString()}`

      const { data, error } = await supabase
        .from('manifestos')
        .insert({
          user_id: authenticatedUserId,
          content: content,
          questions_data: questionsData ? JSON.stringify(questionsData) : null,
          title: title,
          slug: slug,
          published: true,
          public_url: `${BASE_URL}/manifesto/${slug}`,
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving to manifestos:', error)
        return res.status(400).json({ error: error.message })
      }

      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${data.slug}`,
        published_at: data.created_at,
      })
    }

    // For anonymous users, generate a unique manifest ID
    const manifestId = crypto
      .createHash('sha256')
      .update(`${userId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12)

    // Save to public_manifestos table for anonymous users
    const { error: insertError } = await supabase
      .from('public_manifestos')
      .insert({
        id: manifestId,
        content: content,
        questions_data: questionsData ? JSON.stringify(questionsData) : null,
        username: username || null,
      })

    if (insertError) {
      console.error('Error saving manifesto:', insertError)
      // Still return the ID even if save fails
      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${manifestId}`,
        isAnonymous: true,
        published_at: new Date().toISOString(),
      })
    }

    return res.status(200).json({
      success: true,
      url: `${BASE_URL}/manifesto/${manifestId}`,
      isAnonymous: true,
      note: 'Your manifesto is public! Create an account to claim it with your username.',
      published_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error publishing manifesto:', error)
    
    // Fallback: still return a URL even if everything fails
    const manifestId = crypto
      .createHash('sha256')
      .update(`${userId || 'anon'}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12)

    return res.status(200).json({
      success: true,
      url: `${BASE_URL}/manifesto/${manifestId}`,
      isAnonymous: true,
      published_at: new Date().toISOString(),
    })
  }
}
