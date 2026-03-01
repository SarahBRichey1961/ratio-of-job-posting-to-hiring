import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'
import crypto from 'crypto'

const BASE_URL = process.env.NEXT_PUBLIC_MANIFESTO_BASE_URL || 'https://takethereigns.ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, content, username, questionsData } = req.body
  console.log('=== PUBLISH MANIFESTO ===')
  console.log('Body received:', { userId, hasContent: !!content, username, hasQuestionsData: !!questionsData })

  if (!content) {
    return res.status(400).json({ error: 'Content required' })
  }

  try {
    const supabase = getSupabase()
    if (!supabase) {
      console.log('Supabase client not initialized')
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

    // Get auth token from Authorization header
    const authHeader = req.headers.authorization
    let authenticatedUserId: string | null = null
    let userEmail: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      
      try {
        // Verify the token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          authenticatedUserId = user.id
          userEmail = user.email || null
        }
      } catch (err) {
        console.error('Error verifying token:', err)
      }
    }
    
    console.log('Auth check - authenticatedUserId:', authenticatedUserId, 'email:', userEmail)

    // If user is authenticated, save to new manifestos table
    if (authenticatedUserId && userEmail) {
      console.log('User is authenticated, saving to manifestos table with email:', userEmail)
      
      // Use email as slug (or username if provided)
      const slug = username || userEmail
      const title = `Manifesto - ${new Date().toLocaleDateString()}`

      // First, check if a manifesto with this slug already exists for this user
      const { data: existingManifesto, error: checkError } = await supabase
        .from('manifestos')
        .select('id')
        .eq('user_id', authenticatedUserId)
        .eq('slug', slug)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking for existing manifesto:', checkError)
        // Continue anyway - we'll try to insert
      }

      let data, error

      if (existingManifesto && existingManifesto.id) {
        // Update existing manifesto
        console.log('Updating existing manifesto:', existingManifesto.id)
        const result = await supabase
          .from('manifestos')
          .update({
            content: content,
            questions_data: questionsData ? JSON.stringify(questionsData) : null,
            title: title,
            published: true,
            public_url: `${BASE_URL}/manifesto/${slug}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingManifesto.id)
          .select()
          .single()
        
        data = result.data
        error = result.error
        if (error) console.error('Update error:', error)
      } else {
        // Insert new manifesto
        console.log('Creating new manifesto with slug:', slug)
        console.log('Insert data:', { user_id: authenticatedUserId, slug, content_length: content.length })
        const result = await supabase
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
        
        data = result.data
        error = result.error
        if (error) console.error('Insert error:', error)
      }

      if (error) {
        console.error('Error saving to manifestos:', error)
        console.error('Error details:', { code: error.code, message: error.message, details: error.details })
        return res.status(400).json({ 
          error: error.message,
          details: error.details,
          code: error.code
        })
      }

      console.log('Successfully saved to manifestos with slug:', data.slug)
      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${data.slug}`,
        email: userEmail,
        published_at: data.created_at,
      })
    }

    // For anonymous users, generate a unique manifest ID
    console.log('User is anonymous, saving to public_manifestos')
    const manifestId = crypto
      .createHash('sha256')
      .update(`${userId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12)
    
    console.log('Generated manifestId:', manifestId)

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
      console.error('Error saving to public_manifestos:', insertError)
      // Still return the ID even if save fails
      return res.status(200).json({
        success: true,
        url: `${BASE_URL}/manifesto/${manifestId}`,
        isAnonymous: true,
        published_at: new Date().toISOString(),
        warning: insertError.message,
      })
    }

    console.log('Successfully saved to public_manifestos, returning URL:', `${BASE_URL}/manifesto/${manifestId}`)
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
