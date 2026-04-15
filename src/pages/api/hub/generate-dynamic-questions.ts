import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  appName: string
  mainIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OpenAI API key not configured',
      instructions: 'Admin must set OPENAI_API_KEY in environment variables',
    })
  }

  try {
    const { appName, mainIdea, targetUser, problemSolved, howItWorks } = req.body as RequestBody

    if (!appName || !mainIdea || !targetUser || !problemSolved || !howItWorks) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Generate dynamic questions using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system' as const,
            content: `You are a product strategy expert. Generate 6-8 specific, actionable questions to help refine and build this app. 
            
Questions should be:
- Specific to THIS app's unique features and use case (not generic)
- Focused on: features, target market segment, monetization, tech stack, timeline, success metrics
- Concise and answerable (not too broad)
- Progressive (build on each other)

Return ONLY a JSON array of question strings, no other text.
Example format: ["Question 1?", "Question 2?", ...]`,
          },
          {
            role: 'user' as const,
            content: `App Name: ${appName}
Main Idea: ${mainIdea}
Target User: ${targetUser}
Problem Solved: ${problemSolved}
How It Works: ${howItWorks}

Generate 6-8 specific questions to help build this app. Return ONLY valid JSON array, no markdown, no code blocks.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return res.status(500).json({
        error: 'Failed to generate questions from OpenAI',
        details: errorData.error?.message || 'Unknown error',
      })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '[]'

    // Parse the response - handle both raw JSON and markdown-wrapped JSON
    let questions: string[] = []
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      questions = JSON.parse(jsonStr)
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content)
      return res.status(500).json({
        error: 'Failed to parse generated questions',
        raw: content,
      })
    }

    // Ensure we have an array of strings
    if (!Array.isArray(questions)) {
      questions = []
    }
    questions = questions.filter(q => typeof q === 'string').slice(0, 8)

    return res.status(200).json({
      questions,
    })
  } catch (err) {
    console.error('Error generating dynamic questions:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate questions'
    return res.status(500).json({ error: message })
  }
}
