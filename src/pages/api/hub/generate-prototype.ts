import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  originalIdea: {
    mainIdea: string
    targetUser: string
    problemSolved: string
    howItWorks: string
  }
  questions: string[]
  answers: string[]
}

interface PrototypeResponse {
  htmlMockup: string
  userFlow: string[]
  feasibility: string
  buildPlan: string[]
  technologies: string[]
  testStrategy: string
  launchStrategy: string
  mvpTasks: string[]
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string

async function generatePrototype(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not configured')
    return res.status(500).json({ error: 'AI service not configured' })
  }

  try {
    const { originalIdea, questions, answers } = req.body as RequestBody

    if (!originalIdea) {
      return res.status(400).json({ error: 'Missing original idea' })
    }

    // Build context from Q&A if available
    let qaContext = ''
    if (questions && questions.length > 0 && answers && answers.length > 0) {
      qaContext = questions
        .map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided'}`)
        .join('\n\n')
    }

    const systemPrompt = `You are an expert product strategist helping beginners turn ideas into launchable products. 
Your job is to generate an interactive prototype, step-by-step build plan, and launch strategy.

Guidelines:
- Generate HTML mockup that shows a clickable prototype (use vanilla HTML/CSS/JS - NO external dependencies)
- User flow should be step-by-step instructions beginners can follow to test with real users
- Only recommend beginner-friendly tech: GitHub, Netlify, Figma, Next.js, React, Supabase
- For payments: PREFER PayPal, Zelle, Venmo, or Square (simpler for beginners). AVOID Stripe (complex setup).
- Feasibility assessment should be honest about complexity but encouraging
- MVP section should list core features ONLY - no "nice to haves"
- Test strategy should focus on talking to real users before launch (best practice)
- Build plan should be ordered in dependency order (what depends on what)

Always respond with a valid JSON object with these exact keys (all strings or string arrays):
{
  "htmlMockup": "<html>...</html>",
  "userFlow": ["Step 1...", "Step 2..."],
  "feasibility": "Assessment text",
  "buildPlan": ["Task 1", "Task 2"],
  "technologies": ["Tech 1: Description", "Tech 2: Description"],
  "testStrategy": "Testing approach text",
  "launchStrategy": "Launching strategy text",
  "mvpTasks": ["Feature 1", "Feature 2"]
}

Return ONLY valid JSON, no other text.`

    let userPrompt = `Based on this idea, generate a complete prototype and build plan:

ORIGINAL IDEA:
Main Idea: ${originalIdea.mainIdea}
Target User: ${originalIdea.targetUser}
Problem Solved: ${originalIdea.problemSolved}
How It Works: ${originalIdea.howItWorks}`

    if (qaContext) {
      userPrompt += `

CLARIFICATIONS FROM USER:
${qaContext}`
    }

    userPrompt += `

Generate an interactive HTML prototype that demonstrates how this app works. Include a step-by-step user flow, complete build plan, recommended tech stack (only beginner-friendly tools), MVP features, testing strategy, and launch strategy.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
    const prototype: PrototypeResponse = JSON.parse(content)

    // Validate response structure
    if (
      !prototype.htmlMockup ||
      !Array.isArray(prototype.userFlow) ||
      !prototype.feasibility ||
      !Array.isArray(prototype.buildPlan) ||
      !Array.isArray(prototype.technologies) ||
      !prototype.testStrategy ||
      !prototype.launchStrategy ||
      !Array.isArray(prototype.mvpTasks)
    ) {
      throw new Error('Invalid response format from AI')
    }

    return res.status(200).json(prototype)
  } catch (error) {
    console.error('Error generating prototype:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: `Failed to generate prototype: ${message}` })
  }
}

export default generatePrototype
