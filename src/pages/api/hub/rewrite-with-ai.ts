import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  text: string
  appName: string
  appIdea: string
  rewriteStyle?: string
  senderName?: string        // For grandparent apps: the grandparent's name
  senderLocation?: string    // For grandparent apps: the grandparent's location
  recipientName?: string     // For grandparent apps: the grandchild's name (if available)
}

/**
 * API endpoint for generated apps to call back and use AI to rewrite content
 * This allows Netlify-deployed apps to have AI functionality
 */
export default async function rewriteWithAI(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers - allow all origins since this is for deployed Netlify apps
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    console.error(`❌ OPENAI_API_KEY missing`)
    return res.status(500).json({
      error: 'OpenAI API key not configured',
    })
  }

  try {
    const body = req.body as RequestBody

    if (!body.text) {
      return res.status(400).json({ error: 'Missing text to rewrite' })
    }

    const { text, appName, appIdea, rewriteStyle, senderName, senderLocation, recipientName } = body

    console.log(`\n📝 Rewrite request for: ${appName}`)
    console.log(`   Style: ${rewriteStyle || 'default'}`)
    console.log(`   Text length: ${text.length} chars`)
    if (senderName) console.log(`   From: ${senderName}`)
    if (senderLocation) console.log(`   Location: ${senderLocation}`)

    // Build the rewrite prompt based on app idea
    let prompt = ''
    
    if (appIdea && appIdea.includes('letter') && appIdea.includes('grandparent')) {
      // Grandparent letter rewriting with personalization
      const signoff = senderName ? `With love from your grandparent,\n${senderName}${senderLocation ? ' in ' + senderLocation : ''}` : 'With all my love,'
      const salutation = recipientName ? `Dear ${recipientName},` : 'Dear my loved one,'
      
      prompt = `You are a heartwarming letter writer. Transform this message into a beautiful, kind letter from a loving grandparent to their grandchild.

Original message:
"${text}"

PERSONALIZATION:
- Start with: "${salutation}"
- End with: "${signoff}"
- Include the grandparent's wisdom, warmth, and deep affection throughout

Write a warm, loving letter that captures the sentiment of the original message but elevates it with grandparental wisdom, affection, and tenderness. Include personal touches like terms of endearment and expressions of love.

Keep it to 2-3 paragraphs.

Return ONLY the complete letter (including the salutation and sign-off above), no other commentary.`
    } else if (rewriteStyle === 'poem') {
      prompt = `Transform this into a beautiful poem:

"${text}"

Make it poetic, evocative, and meaningful. Return ONLY the poem.`
    } else if (rewriteStyle === 'professional') {
      prompt = `Transform this into professional, polished writing:

"${text}"

Make it eloquent and professional. Return ONLY the text.`
    } else if (rewriteStyle === 'casual') {
      prompt = `Make this more conversational and friendly:

"${text}"

Add warmth and personality. Return ONLY the rewritten text.`
    } else {
      // Default: try to make it better
      prompt = `Improve and enhance this text while keeping its core meaning:

"${text}"

Make it more eloquent, clear, and impactful. Return ONLY the improved text.`
    }

    console.log(`   📤 Calling OpenAI...`)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`   ❌ OpenAI API error (${response.status}):`, error)
      throw new Error(`OpenAI API failed (${response.status}): ${error}`)
    }

    const data = await response.json()
    const rewrittenText = data.choices?.[0]?.message?.content

    if (!rewrittenText) {
      console.error(`   ❌ No content in OpenAI response:`, data)
      throw new Error('Empty response from OpenAI')
    }

    console.log(`   ✅ Rewrite successful (${rewrittenText.length} chars)`)

    return res.status(200).json({
      success: true,
      original: text,
      rewritten: rewrittenText.trim(),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ REWRITE FAILED: ${msg}`)
    return res.status(500).json({ error: msg })
  }
}
