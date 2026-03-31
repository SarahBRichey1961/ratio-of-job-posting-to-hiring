import { NextApiRequest, NextApiResponse } from 'next'

interface IdeaFormData {
  mainIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string

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

    // First, analyze if the idea is clear enough or needs clarification
    const analysisPrompt = `You are a startup advisor evaluating if a user's idea description is clear enough to build, or if it needs clarification.

The user's idea:
- Main Idea: ${mainIdea}
- Target User: ${targetUser}
- Problem Solved: ${problemSolved}
- How It Works: ${howItWorks}

Analyze: Is this idea clear and specific enough to move forward with building a prototype? Or does it need clarification questions?

Rules:
- If the idea covers: what it does, who uses it, what problem it solves, and basic flow → READY
- If anything is vague, missing details, or unclear → NEEDS_CLARIFICATION

Respond with ONLY this JSON format:
{
  "decision": "READY" or "NEEDS_CLARIFICATION",
  "questions": ["Question 1?", "Question 2?"] (only if NEEDS_CLARIFICATION, max 5 questions, or empty array if READY)
}

Make sure it's valid JSON with no other text.`

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!analysisResponse.ok) {
      const error = await analysisResponse.json()
      console.error('OpenAI API error:', error)
      throw new Error(`OpenAI error: ${error.error?.message || 'Unknown error'}`)
    }

    const analysisData = await analysisResponse.json()
    const analysisContent = analysisData.choices[0]?.message?.content

    if (!analysisContent) {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(analysisContent)

    // If questions are needed, return them
    if (analysis.decision === 'NEEDS_CLARIFICATION' && analysis.questions?.length > 0) {
      return res.status(200).json({
        questions: analysis.questions,
      })
    }

    // Idea is clear! Generate a basic prototype structure that will be filled by generate-prototype.ts
    // For now, return empty prototype data to signal to frontend to call generate-prototype
    return res.status(200).json({
      htmlMockup: '<div>Generating prototype...</div>',
      userFlow: [],
      feasibility: '',
      buildPlan: [],
      technologies: [],
      testStrategy: '',
      launchStrategy: '',
      mvpTasks: [],
    })
  } catch (err) {
    console.error('Error analyzing idea:', err)
    const message = err instanceof Error ? err.message : 'Failed to analyze idea'
    return res.status(500).json({ error: message })
  }
}
