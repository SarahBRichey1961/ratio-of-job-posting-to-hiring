import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = process.env.NEXT_PUBLIC_MANIFESTO_BASE_URL || 'https://takethereigns.ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, questions, tones, pronouns, generateMeme } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Questions required' })
  }

  // Validate tones if provided
  if (tones && (!Array.isArray(tones) || tones.length > 2)) {
    return res.status(400).json({ error: 'Tones must be an array with maximum 2 items' })
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured')
    return res.status(500).json({ 
      error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your Netlify environment variables.',
      details: 'Missing OPENAI_API_KEY'
    })
  }

  try {
    // Build question/answer pairs for the prompt
    const questionAnswerPairs = questions
      .map((q, index) => `**Q${index + 1}: ${q.question}**\n${q.answer}`)
      .join('\n\n')

    // Build tone instructions if provided
    let toneInstructions = ''
    if (tones && tones.length > 0) {
      if (tones.length === 1) {
        toneInstructions = `\n\nIMPORTANT: Write this manifesto with a strong ${tones[0]} tone. Infuse the writing with the characteristics of the ${tones[0]} style.`
      } else {
        toneInstructions = `\n\nIMPORTANT: Blend the ${tones[0]} and ${tones[1]} tones in this manifesto. The writing should reflect both ${tones[0].toLowerCase()} and ${tones[1].toLowerCase()} characteristics in equal measure.`
      }
    }

    // Build pronouns instruction if provided
    let pronounsInstruction = ''
    if (pronouns) {
      const pronounsMapping: Record<string, string> = {
        'I am woman hear me roar!': 'as a woman celebrating her power and strength, using "I" and "my"',
        "A man's man": 'as a confident man, using strong masculine energy with "I" pronouns',
        'A bro': 'with a casual, friendly brother energy, using "I" and relatable language for men',
        'A sister': 'with sisterhood energy, using "I" and sister solidarity language',
        'We': 'using collective "we" to emphasize collaboration and team-oriented perspective',
        'Male': 'from a male perspective, using "I" and male pronouns',
        'Female': 'from a female perspective, using "I" and female pronouns',
        'Binary': 'in a gender-neutral way, using "I" and inclusive language',
      }
      const pronounsDescription = pronounsMapping[pronouns] || pronouns
      pronounsInstruction = `\n\nIMPORTANT: Write this manifesto ${pronounsDescription}.`
    }

    // Build prompt for GPT to write the manifesto
    const prompt = `
You are a ghostwriter creating a compelling personal manifesto for a professional. 

Based on the following answers to their custom questions, write an authentic, powerful manifesto (300-400 words) that captures their essence, values, and vision. The manifesto should:
- Be written in first person
- Sound personal and authentic, not corporate
- Balance passion with professionalism
- Include specific details from their answers
- Be memorable and quotable
- End with a clear statement of their vision
- Respect the unique questions they chose to answer

Here are their answers:

${questionAnswerPairs}${pronounsInstruction}${toneInstructions}

Write the manifesto now. Make it powerful, personal, and true.`

    console.log('Calling OpenAI API with', questions.length, 'questions')

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert ghostwriter who creates compelling personal manifestos for professionals. Your writing is authentic, powerful, and memorable. Respect the questions they chose to answer and write to their unique voice and perspective.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const manifesto = response.data.choices[0]?.message?.content

    if (!manifesto) {
      console.error('No content in OpenAI response')
      return res.status(500).json({ error: 'Failed to generate manifesto - no content from API' })
    }

    console.log('Successfully generated manifesto')

    // Generate meme if requested (with timeout)
    let memeImage = null
    if (generateMeme) {
      try {
        // Extract a powerful quote from the manifesto (middle sentence)
        const sentences = manifesto.split('.').filter((s: string) => s.trim().length > 0)
        const memeQuote = sentences.length > 0 
          ? sentences[Math.floor(sentences.length / 2)].trim().slice(0, 100) 
          : 'I will be the difference'

        console.log('Generating meme with quote:', memeQuote)

        // Call DALL-E with timeout
        const imageResponse = await Promise.race([
          axios.post(
            'https://api.openai.com/v1/images/generations',
            {
              prompt: `Create an inspirational meme graphic with the text "${memeQuote}". Modern design, bold typography, meaningful visual elements, professional look. Image should be square format suitable for web display.`,
              n: 1,
              size: '256x256',
              quality: 'standard',
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              timeout: 40000, // 40 second timeout for DALL-E (it can be slow)
            }
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Meme generation timeout after 45 seconds')), 45000)
          )
        ] as const)

        if ((imageResponse as any).data.data && (imageResponse as any).data.data.length > 0) {
          memeImage = (imageResponse as any).data.data[0].url
          console.log('Successfully generated meme image')
        }
      } catch (memeError: any) {
        console.warn('Meme generation failed (non-blocking):', memeError.message)
        // Continue without meme - it's optional
      }
    }

    // Generate a URL slug from the user ID (you can fetch username later)
    const url = `${BASE_URL}/manifesto/${userId}`

    return res.status(200).json({
      manifesto,
      url,
      preview: manifesto.substring(0, 150) + '...',
      memeImage: memeImage || null,
    })
  } catch (error: any) {
    console.error('Error generating manifesto:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config?.url,
    })
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'OpenAI API authentication failed. Check that OPENAI_API_KEY is correct.',
        details: 'Invalid API key'
      })
    }

    if (error.response?.status === 429) {
      return res.status(500).json({
        error: 'Too many requests to OpenAI API. Please try again in a moment.',
        details: 'Rate limited'
      })
    }

    return res.status(500).json({
      error: error.response?.data?.error?.message || error.message || 'Failed to generate manifesto',
      details: error.response?.data || 'Unknown error'
    })
  }
}

