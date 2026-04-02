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

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY as string

async function generatePrototype(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured')
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

    let userPrompt = `You are an expert product strategist. Generate a complete prototype and build plan for this idea.

IDEA:
- Main: ${originalIdea.mainIdea}
- Target User: ${originalIdea.targetUser}
- Problem: ${originalIdea.problemSolved}
- How It Works: ${originalIdea.howItWorks}`

    if (qaContext) {
      userPrompt += `\n\nCLARIFICATIONS:\n${qaContext}`
    }

    userPrompt += `

Generate a JSON response with these exact keys (no other text before/after):
{
  "htmlMockup": "<html><head><style>body{font-family:Arial;padding:20px}</style></head><body><h1>Prototype</h1><p>Interactive prototype goes here</p></body></html>",
  "userFlow": ["User opens app", "User sees main screen", "User clicks action button"],
  "feasibility": "This idea is feasible with moderate complexity. Focus on MVP first.",
  "buildPlan": ["Setup GitHub repo", "Design database schema", "Build backend API", "Create frontend UI"],
  "technologies": ["GitHub: Version control", "Netlify: Hosting", "Next.js: Frontend framework", "Supabase: Database"],
  "testStrategy": "Start with 5-10 real users. Watch them use it. Ask what's confusing.",
  "launchStrategy": "Beta launch to email list. Get feedback. Iterate quickly.",
  "mvpTasks": ["Core feature 1", "Core feature 2", "Basic dashboard"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Anthropic API error:', error)
      throw new Error(`Anthropic error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('No response from Anthropic')
    }

    // Extract JSON from response (Claude may include it wrapped in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response')
    }

    // Parse JSON response
    const prototype: PrototypeResponse = JSON.parse(jsonMatch[0])

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
