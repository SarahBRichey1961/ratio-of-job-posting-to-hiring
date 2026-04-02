import { NextApiRequest, NextApiResponse } from 'next'

interface IdeaFormData {
  mainIdea: string
  targetUser: string
  problemSolved: string
  howItWorks: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { mainIdea, targetUser, problemSolved, howItWorks } = req.body as IdeaFormData

    if (!mainIdea || !targetUser || !problemSolved || !howItWorks) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Smart heuristic analysis - check if idea has sufficient detail
    const ideaQuality = analyzeIdeaClarity(mainIdea, targetUser, problemSolved, howItWorks)
    
    if (ideaQuality.needsClarification) {
      return res.status(200).json({
        questions: ideaQuality.questions,
      })
    }

    // Idea is clear! Signal to frontend to proceed with prototype generation
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

// Heuristic-based idea analysis that doesn't require external APIs
function analyzeIdeaClarity(
  mainIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string
) {
  const questions: string[] = []

  // Check main idea clarity
  if (mainIdea.length < 10) {
    questions.push('Can you provide more details about your main idea? Be more specific about what it does.')
  }
  if (!hasKeywords(mainIdea, ['app', 'service', 'tool', 'platform', 'system', 'product', 'solution'])) {
    questions.push('What type of product/service is this? (app, web service, tool, etc.)')
  }

  // Check target user clarity
  if (targetUser.length < 10) {
    questions.push('Who is your target user? Be specific about their role or characteristics.')
  }
  if (!hasKeywords(targetUser, ['business', 'team', 'freelancer', 'developer', 'designer', 'manager', 'user', 'customer', 'professional', 'student'])) {
    questions.push('Describe specific characteristics of your target user (age, profession, skills, needs, etc.)')
  }

  // Check problem clarity
  if (problemSolved.length < 15) {
    questions.push('What specific problem does this solve? Describe it in more detail.')
  }
  if (!hasKeywords(problemSolved, ['time', 'cost', 'effort', 'complexity', 'pain', 'hard', 'difficult', 'waste', 'slow', 'manual'])) {
    questions.push('What pain point or inefficiency does this address? Why is it a problem?')
  }

  // Check how it works clarity
  if (howItWorks.length < 20) {
    questions.push('Explain how your solution works - what are the main steps or features?')
  }
  if (!hasKeywords(howItWorks, ['step', 'then', 'after', 'first', 'next', 'process', 'flow', 'automatically', 'manually'])) {
    questions.push('Walk through the main workflow or user flow. How do users interact with it?')
  }

  return {
    needsClarification: questions.length > 0,
    questions: questions.slice(0, 5), // Max 5 questions
  }
}

function hasKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase()
  return keywords.some(keyword => lowerText.includes(keyword))
}
