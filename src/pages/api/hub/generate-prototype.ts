import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  originalIdea: {
    mainIdea: string
    targetUser: string
    problemSolved: string
    howItWorks: string
  }
  questions?: string[]
  answers?: string[]
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { originalIdea } = req.body as RequestBody

    if (!originalIdea) {
      return res.status(400).json({ error: 'Missing original idea' })
    }

    const prototype = generatePrototype(originalIdea)
    return res.status(200).json(prototype)
  } catch (error) {
    console.error('Error generating prototype:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: message })
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

function generatePrototype(originalIdea: RequestBody['originalIdea']): PrototypeResponse {
  const { mainIdea, targetUser, problemSolved, howItWorks } = originalIdea

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
        <div class="feature">Core Value Proposition</div>
        <div class="feature">Targeted Solution</div>
        <div class="feature">Growth Potential</div>
      </div>
      <button class="cta">Get Started</button>
    </div>
  </div>
</body>
</html>`

  const userFlow = [
    'User lands on homepage and sees value proposition',
    'User learns how your solution solves their problem',
    'User sees target audience matches their profile',
    'User clicks Get Started to begin using the product',
    'User completes onboarding flow',
    'User accesses core features',
    'User experiences the main benefit',
  ]

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

  const feasibility = 'This idea is feasible to build. Start with a minimal viable product (MVP) focusing on the core problem. Build the core features first, validate with real users, then expand based on feedback. Estimated timeline: 4-12 weeks depending on complexity and team size.'

  const testStrategy = 'Talk to 5-10 real potential users before building. Ask them about their current solutions and pain points. After building an MVP, conduct user testing sessions. Watch users try to use your product without guidance. Ask what confused them. Iterate based on feedback.'

  const launchStrategy = 'Launch to a closed beta group first (10-50 users). Gather feedback and fix bugs. Then launch publicly through your network, relevant communities, and Product Hunt. Focus on getting early adopters who love your product. Their testimonials are more powerful than any marketing.'

  const mvpTasks = [
    'Core Problem Solution: Build the minimum needed to solve the stated problem',
    'User Onboarding: Simple signup and login system',
    'Main Feature: The key benefit that makes your product valuable',
    'Analytics: Track what users do to understand usage patterns',
    'Feedback Collection: Get user feedback for continuous improvements',
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
