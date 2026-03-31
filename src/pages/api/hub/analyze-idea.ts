import { NextApiRequest, NextApiResponse } from 'next'

interface IdeaFormData {
  mainIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
}

interface AIAnalysis {
  feasibility: string
  buildPlan: string[]
  technologies: string[]
  testStrategy: string
  launchStrategy: string
  mvpTasks: string[]
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured')
    return res.status(500).json({ error: 'AI service not configured' })
  }

  try {
    const { mainIdea, targetUser, problemSolved, howItWorks } = req.body as IdeaFormData

    if (!mainIdea || !targetUser || !problemSolved || !howItWorks) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create prompt for OpenAI
    const prompt = `You are a helpful startup advisor helping beginners build their ideas with industry best practices.

The user has this idea:
- Main Idea: ${mainIdea}
- Target User: ${targetUser}
- Problem Solved: ${problemSolved}
- How It Works: ${howItWorks}

Please provide a concise analysis in JSON format with these fields:
1. "feasibility": A 2-3 sentence assessment of whether this idea is feasible to build and launch (be encouraging but realistic)
2. "buildPlan": A list of 5-7 specific steps to build this idea (be concrete and actionable)
3. "technologies": A list of 2-3 ONLY beginner-friendly, zero-config tools they could use. Options:
   - GitHub (version control + free static site hosting)
   - Netlify (free hosting)
   - Figma (free design mockups, no coding needed)
   Pick the 2-3 most relevant for their idea with one sentence explanation each.
4. "mvpTasks": A list of 4-6 must-have features for the MVP (minimum viable product) to launch
5. "testStrategy": A 3-4 sentence detailed testing strategy before launch. Include:
   - What to test (core features)
   - Who to test with (friends, beta users)
   - How to gather feedback
   - What success looks like
6. "launchStrategy": A 2-3 sentence strategy for how to get their first 10-20 users

Return ONLY valid JSON, no other text.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const analysis: AIAnalysis = JSON.parse(content)

    // Validate response structure
    if (!analysis.feasibility || !analysis.buildPlan || !analysis.technologies || !analysis.mvpTasks || !analysis.testStrategy || !analysis.launchStrategy) {
      throw new Error('Invalid response format from AI')
    }

    return res.status(200).json(analysis)
  } catch (err) {
    console.error('Error analyzing idea:', err)
    const message = err instanceof Error ? err.message : 'Failed to analyze idea'
    return res.status(500).json({ error: message })
  }
}
