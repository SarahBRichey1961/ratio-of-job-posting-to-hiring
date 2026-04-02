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

  try {
    const { originalIdea, questions, answers } = req.body as RequestBody

    if (!originalIdea) {
      return res.status(400).json({ error: 'Missing original idea' })
    }

    // Try to use Anthropic API if available, otherwise use smart fallback
    if (ANTHROPIC_API_KEY) {
      try {
        return await generateWithAnthropic(originalIdea, questions, answers, res)
      } catch (apiError) {
        console.warn('Anthropic API failed, using fallback:', apiError instanceof Error ? apiError.message : 'Unknown error')
        // Fall through to fallback
      }
    }

    // Fallback: Generate prototype using heuristics (no API call needed)
    const prototype = generatePrototypeFallback(originalIdea, questions, answers)
    return res.status(200).json(prototype)
  } catch (error) {
    console.error('Error generating prototype:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: `Failed to generate prototype: ${message}` })
  }
}

async function generateWithAnthropic(
  originalIdea: RequestBody['originalIdea'],
  questions: string[] | undefined,
  answers: string[] | undefined,
  res: NextApiResponse
) {
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

Generate ONLY a valid JSON response with these exact keys (no markdown, no other text):
{
  "htmlMockup": "<html>...</html>",
  "userFlow": ["Step 1", "Step 2"],
  "feasibility": "Text assessment",
  "buildPlan": ["Task 1", "Task 2"],
  "technologies": ["Tech: Description"],
  "testStrategy": "Testing approach",
  "launchStrategy": "Launch approach",
  "mvpTasks": ["Feature 1"]
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
    const errorData = await response.json()
    console.error('Anthropic API error response:', errorData)
    throw new Error(`Anthropic API responded with ${response.status}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    throw new Error('No content in Anthropic response')
  }

  // Extract JSON from response (Claude may include it wrapped in markdown)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('Could not extract JSON from:', content.substring(0, 200))
    throw new Error('Could not parse JSON from response')
  }

  // Parse and validate
  const prototype: PrototypeResponse = JSON.parse(jsonMatch[0])
  validatePrototype(prototype)
  return res.status(200).json(prototype)
}

function validatePrototype(prototype: PrototypeResponse): void {
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
}

function generatePrototypeFallback(
  originalIdea: RequestBody['originalIdea'],
  questions: string[] | undefined,
  answers: string[] | undefined
): PrototypeResponse {
  const { mainIdea, targetUser, problemSolved, howItWorks } = originalIdea

  // Generate basic HTML mockup
  const htmlMockup = `<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px; margin-bottom: 40px; }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { background: white; padding: 30px; border-radius: 8px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .section p { color: #666; line-height: 1.6; margin-bottom: 10px; }
    .feature { background: #f9f9f9; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
    .cta { background: #667eea; color: white; padding: 15px 30px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin-top: 20px; }
    .cta:hover { background: #764ba2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(mainIdea)}</h1>
      <p>Solving: ${escapeHtml(problemSolved)}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Target User</h2>
        <p>${escapeHtml(targetUser)}</p>
      </div>
      
      <div class="section">
        <h2>How It Works</h2>
        <p>${escapeHtml(howItWorks)}</p>
      </div>
      
      <div class="section">
        <h2>Key Features</h2>
        <div class="feature">✨ Core Value Proposition</div>
        <div class="feature">🎯 Targeted Solution</div>
        <div class="feature">📈 Growth Potential</div>
      </div>
      
      <button class="cta">Get Started →</button>
    </div>
  </div>
</body>
</html>`

  // Generate reasonable user flow
  const userFlow = [
    'User lands on homepage and sees value proposition',
    'User learns how your solution solves their problem',
    'User sees target audience matches their profile',
    'User clicks "Get Started" to begin using the product',
    'User completes onboarding flow',
    'User accesses core features',
    'User experiences the main benefit',
  ]

  // Generate build plan based on complexity heuristics
  const buildPlan = [
    'Set up GitHub repository and development environment',
    'Design database schema and data models',
    'Create project specification and user stories',
    'Build backend API with core endpoints',
    'Implement user authentication system',
    'Create frontend UI components',
    'Integrate frontend with backend API',
    'Implement core features',
    'Add analytics and monitoring',
    'Deploy to production environment',
  ]

  const technologies = [
    'GitHub: Version control and collaboration',
    'Netlify: Frontend hosting and deployment',
    'Next.js: Full-stack React framework',
    'Supabase: PostgreSQL database with real-time APIs',
    'TypeScript: Type-safe JavaScript',
    'Tailwind CSS: Utility-first styling',
  ]

  const feasibility = 'This idea is feasible to build. Start with a minimal viable product (MVP) focusing on the core problem you\'re solving. Build the core features first, validate with real users, then expand based on feedback. Estimated timeline: 4-12 weeks depending on complexity and team size.'

  const testStrategy = 'Talk to 5-10 real potential users before building. Ask them about their current solutions and pain points. After building an MVP, conduct user testing sessions. Watch users try to use your product without guidance. Ask what confused them. Iterate based on feedback.'

  const launchStrategy = 'Launch to a closed beta group first (10-50 users). Gather feedback and fix bugs. Then launch publicly through your network, relevant communities, and Product Hunt. Focus on getting early adopters who love your product. Their testimonials are more powerful than any marketing.'

  const mvpTasks = [
    `Core Problem Solution: Build the minimum needed to solve "${problemSolved}"`,
    `User Onboarding: Simple signup/login for ${targetUser}`,
    `Main Feature: The key benefit that makes your product valuable`,
    `Analytics: Track what users do (to understand usage patterns)',
    `Feedback Collection: Get user feedback for improvements`,
  ]

  return {
    htmlMockup,
    userFlow,
    feasibility,
    buildPlan,
    technologies,
    testStrategy,
    launchStrategy,
    mvpTasks,
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

export default generatePrototype
