import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  appName: string
  appIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
  questions?: string[]
  answers?: string[]
  technologies?: string[]
  buildPlan?: string[]
}

/**
 * Generate a custom app based on the user's specific idea and answers
 * Uses Claude to create an app tailored to their exact use case
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY missing')
    return res.status(500).json({
      error: 'Claude API key not configured. Admin must set ANTHROPIC_API_KEY in environment variables.',
    })
  }

  try {
    const body = req.body as RequestBody

    if (!body.appName || !body.appIdea) {
      return res.status(400).json({
        error: 'Missing required fields: appName and appIdea',
      })
    }

    console.log(`\n🎨 GENERATING CUSTOM APP: ${body.appName}`)
    console.log(`   Idea: ${body.appIdea}`)
    console.log(`   Target: ${body.targetUser}`)
    console.log(`   Problem: ${body.problemSolved}`)

    // Build context from answers if provided
    const answerContext =
      body.questions && body.answers
        ? body.questions
            .map((q, i) => `Q: ${q}\nA: ${body.answers?.[i] || 'Not answered'}`)
            .join('\n\n')
        : ''

    const prompt = `You are an expert web developer. Generate a CUSTOM, FUNCTIONAL web app that matches THIS SPECIFIC request.

APP SPECIFICATION:
- Name: ${body.appName}
- Main Idea: ${body.appIdea}
- Target User: ${body.targetUser}
- Problem It Solves: ${body.problemSolved}
- How It Works: ${body.howItWorks}

${
  answerContext
    ? `DETAILED USER ANSWERS TO CLARIFYING QUESTIONS:
${answerContext}

CRITICAL: Use these specific answers to guide your app design. Make it custom to THEIR use case, not generic.`
    : ''
}

REQUIREMENTS:
1. Generate a COMPLETE, WORKING single-file HTML+CSS+JavaScript app
2. The app should be SPECIFIC to the problem/user/idea above, NOT generic
3. Include realistic features that address the stated problem
4. Make it functional and interactive
5. Style it professionally with Tailwind CSS (CDN)
6. Include a favicon link (won't error if missing)

RESPONSE FORMAT - Return ONLY valid JSON (no markdown, no code blocks):
{
  "html": "<complete HTML here with all CSS and JS inline>"
}

Make the app reflect the specific user's need, not a generic template. If they want to help grandparents video call, build a simplified video call UI. If they want task tracking for remote teams, build a task board. Make it SPECIFIC.`

    console.log(`   📡 Calling Claude API...`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Claude API Error (${response.status}):`, error)
      throw new Error(`Claude API failed: ${response.statusText}`)
    }

    const data = await response.json()
    const responseText = data.content[0].text

    // Extract JSON from response
    let appHtml = ''
    try {
      // Try to parse as JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const jsonResponse = JSON.parse(jsonMatch[0])
      appHtml = jsonResponse.html

      if (!appHtml) {
        throw new Error('No html field in response')
      }
    } catch (parseErr) {
      console.error(`❌ Failed to parse Claude response:`, parseErr)
      // Fallback: treat entire response as HTML
      appHtml = responseText
    }

    console.log(`   ✅ App generated (${appHtml.length} bytes)`)

    return res.status(200).json({
      success: true,
      html: appHtml,
      appName: body.appName,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ GENERATION FAILED: ${msg}`)
    return res.status(500).json({ error: msg })
  }
}
