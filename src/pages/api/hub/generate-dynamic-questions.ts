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
            content: `You are a product strategy expert. Your job is to ask DEEPLY SPECIFIC questions about THIS PARTICULAR APP IDEA - not generic product questions.

Your questions should be:
1. SPECIFIC TO THE EXACT TARGET USER mentioned (e.g., if target is "grandparents", ask about features/UX for older users, accessibility, their tech comfort level, how to reach them)
2. SPECIFIC TO THE EXACT PROBLEM mentioned (ask how to validate it, who else has tried solving it, what the biggest blocker is)
3. SPECIFIC TO THE EXACT USE CASE (not generic features - ask about THIS app's unique features)
4. ABOUT: features specific to the target user, market validation, revenue model, differentiation, tech constraints, launch timeline

Return ONLY a valid JSON array of 6-8 question strings. No markdown. No code blocks. Just the array.
Example: ["Why did you choose to focus on this specific user segment?", "What feature would make grandparents most excited to use this?", ...]`,
          },
          {
            role: 'user' as const,
            content: `NOW GENERATE SPECIFIC QUESTIONS FOR THIS APP:

App Name: ${appName}
Main Idea: ${mainIdea}  
Target User: ${targetUser}
Problem Being Solved: ${problemSolved}
How It Works: ${howItWorks}

Remember: Ask questions SPECIFIC to "${targetUser}" and THIS app's concept of "${mainIdea}". Not generic questions.
Return ONLY valid JSON array, nothing else.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 1200,
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
