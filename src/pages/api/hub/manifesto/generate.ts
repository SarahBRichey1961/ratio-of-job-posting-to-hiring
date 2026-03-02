import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const STABILITY_API_KEY = process.env.STABILITY_API_KEY
const BASE_URL = process.env.NEXT_PUBLIC_MANIFESTO_BASE_URL || 'https://takethereigns.ai'

// Background function to generate Stability AI meme (fire and forget, don't wait)
// Stability AI is 3-5x faster than DALL-E
async function generateStabilityMemeAsync(memeQuote: string, userId: string): Promise<void> {
  try {
    console.log('Background: Starting Stability AI meme generation (async, non-blocking)')
    
    if (!STABILITY_API_KEY) {
      console.warn('Background: STABILITY_API_KEY not configured, skipping')
      return
    }

    const imageResponse = await Promise.race([
      axios.post(
        'https://api.stability.ai/v1/generate',
        {
          prompt: `Inspirational meme with text "${memeQuote}". Modern design, gradient background, bold white text, professional.`,
          negative_prompt: 'blurry, low quality, distorted text',
          steps: 20,
          guidance_scale: 7,
          width: 512,
          height: 512,
          samples: 1,
          sampler: 'k_dpmpp_2m',
        },
        {
          headers: {
            Authorization: `Bearer ${STABILITY_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000, // Stability AI typically responds in 10-20s
        }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stability AI timeout')), 35000)
      )
    ] as const)

    const artifacts = (imageResponse as any).data.artifacts
    if (artifacts && artifacts.length > 0) {
      const base64Image = artifacts[0].base64
      console.log('Background: Stability AI meme generated successfully')
      // In the future, could save to DB or cache for next time user visits
    }
  } catch (err: any) {
    console.warn('Background: Stability AI meme generation skipped -', err.message)
    // Silently fail - meme was optional enhancement
  }
}

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

    // For meme generation - return QUICKLY without waiting for DALL-E
    // Instead, we'll generate a simple meme immediately and optionally enhance it later
    let memeImage = null
    let memeType = 'none'
    
    if (generateMeme) {
      try {
        // Extract a powerful quote from the manifesto (middle sentence)
        const sentences = manifesto.split('.').filter((s: string) => s.trim().length > 0)
        let memeQuote = sentences.length > 0 
          ? sentences[Math.floor(sentences.length / 2)].trim().slice(0, 100) 
          : 'I will be the difference'

        // Simple word wrap for SVG text (break at ~35 chars or word boundary)
        const wrapText = (text: string, maxChars: number = 35): string[] => {
          const words = text.split(' ')
          const lines: string[] = []
          let currentLine = ''
          
          for (const word of words) {
            if ((currentLine + ' ' + word).trim().length <= maxChars) {
              currentLine = (currentLine + ' ' + word).trim()
            } else {
              if (currentLine) lines.push(currentLine)
              currentLine = word
            }
          }
          if (currentLine) lines.push(currentLine)
          return lines
        }

        const textLines = wrapText(memeQuote)
        
        // Calculate vertical positioning based on number of lines
        let startY = 220
        if (textLines.length === 1) startY = 250
        else if (textLines.length > 2) startY = 200
        const lineSpacing = 60

        // Build SVG with properly wrapped text
        let textElements = ''
        textLines.forEach((line, index) => {
          const yPos = startY + (index * lineSpacing)
          const fontSize = textLines.length > 2 ? 24 : 28
          textElements += `<text x="256" y="${yPos}" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial, sans-serif" dominant-baseline="middle">
            ${line}
          </text>\n`
        })

        const svgMeme = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="url(#bg)"/>
          <circle cx="256" cy="256" r="200" fill="rgba(255,255,255,0.1)"/>
          ${textElements}
          <rect x="40" y="420" width="432" height="70" fill="rgba(0,0,0,0.3)" rx="10"/>
          <text x="256" y="460" font-size="16" fill="white" text-anchor="middle" font-family="Arial, sans-serif">
            ✨ Generated Inspiration ✨
          </text>
        </svg>`
        
        // Convert SVG to data URL
        memeImage = 'data:image/svg+xml;base64,' + Buffer.from(svgMeme).toString('base64')
        memeType = 'svg'
        console.log('Generated instant SVG meme (no API call needed)')
        
        // NOW - generate Stability AI version in background (fire and forget, don't wait)
        // Stability AI is much faster than DALL-E (10-20s vs 30-60s)
        if (STABILITY_API_KEY) {
          generateStabilityMemeAsync(memeQuote, userId).catch(err => {
            console.warn('Background Stability AI meme generation skipped:', err.message)
          })
        }
      } catch (memeError: any) {
        console.warn('Meme generation failed:', memeError.message)
        // Continue without meme
      }
    }

    // Generate a URL slug from the user ID
    const url = `${BASE_URL}/manifesto/${userId}`

    return res.status(200).json({
      manifesto,
      url,
      preview: manifesto.substring(0, 150) + '...',
      memeImage: memeImage || null,
      memeType: memeType, // 'svg' for instant, 'dalle' for AI-generated
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

