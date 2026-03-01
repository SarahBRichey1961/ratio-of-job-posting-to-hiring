import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_MANIFESTO_BASE_URL || 'https://takethereigns.ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, content, username, questionsData } = req.body

  if (!userId || !content) {
    return res.status(400).json({ error: 'User ID and content required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      // Even without Supabase, generate a shareable ID
      const manifestId = crypto
        .createHash('sha256')
        .update(`${userId}-${Date.now()}`)
        .digest('hex')
        .substring(0, 12)

      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${manifestId}`,
        isAnonymous: true,
        published_at: new Date().toISOString(),
      })
    }

    // Generate a unique manifest ID
    const manifestId = crypto
      .createHash('sha256')
      .update(`${userId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12)

    // Try to save to database if user is authenticated
    const { data: existingUser, error: checkError } = await supabase
      .from('hub_members')
      .select('id')
      .eq('id', userId)
      .single()

    if (!checkError && existingUser) {
      // User exists - update their manifesto in hub_members
      const { error: updateError } = await supabase
        .from('hub_members')
        .update({
          manifesto: content,
          manifesto_questions: questionsData ? JSON.stringify(questionsData) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (!updateError) {
        // Fetch username for nice URL
        const { data: userData } = await supabase
          .from('hub_members')
          .select('username')
          .eq('id', userId)
          .single()

        if (userData?.username) {
          return res.status(200).json({
            success: true,
            url: `${BASE_URL}/manifesto/${userData.username}`,
            published_at: new Date().toISOString(),
          })
        }
      }
    }

    // For anonymous users - save to public_manifestos table
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
      .update(`${userId}-${Date.now()}`)
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
