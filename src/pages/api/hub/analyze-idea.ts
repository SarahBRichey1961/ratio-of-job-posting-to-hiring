import { NextApiRequest, NextApiResponse } from 'next'

interface IdeaFormData {
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

  try {
    const { appName, mainIdea, targetUser, problemSolved, howItWorks } = req.body as IdeaFormData

    if (!appName || !mainIdea || !targetUser || !problemSolved || !howItWorks) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Prepare fallback questions in case OpenAI fails - use all the request data
    const generateFallbackQuestions = () => [
      `For ${targetUser}, what's the BIGGEST frustration or pain point that "${appName}" would solve? How do you know this is really what they need?`,
      `Describe exactly how a ${targetUser} would use "${appName}" step-by-step. What would the first 10 seconds look like?`,
      `What would make a ${targetUser} choose "${appName}" instead of what they currently do? What's the competitive advantage?`,
      `How do you want the background colors, font colors, and text justification (left, center, or right aligned) formatted for "${appName}" to appeal to ${targetUser}?`,
      `If you had to charge ${targetUser} for "${appName}", what's the maximum they'd pay and why?`,
      `What's one technical limitation or "hard problem" in "${mainIdea}" that you're not sure how to solve for ${targetUser}?`,
      `How would you find and convince the first 10 ${targetUser} to actually try "${appName}"?`,
      `In one sentence: If "${appName}" is successful for ${targetUser}, what will be different in their life?`,
    ]

    // Call the dynamic question generator endpoint
    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/hub/generate-dynamic-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appName,
        mainIdea,
        targetUser,
        problemSolved,
        howItWorks,
      }),
    })

    if (!generateResponse.ok) {
      console.error('Failed to generate dynamic questions, using context-aware fallback')
      return res.status(200).json({
        questions: generateFallbackQuestions(),
      })
    }

    const data = await generateResponse.json()
    const questions = data.questions || generateFallbackQuestions()
    
    // GUARANTEE the styling question is in the list - append if not present
    const stylingQuestion = `How do you want the background colors, font colors, and text justification (left, center, or right aligned) formatted for "${appName}" to appeal to ${targetUser}?`
    const hasStyleQuestion = questions.some((q: string) => 
      q.toLowerCase().includes('background') || 
      q.toLowerCase().includes('color') || 
      q.toLowerCase().includes('text') || 
      q.toLowerCase().includes('alignment') ||
      q.toLowerCase().includes('formatting')
    )
    
    if (!hasStyleQuestion && questions.length > 0) {
      // Insert styling question as 4th question (after first 3)
      questions.splice(Math.min(3, questions.length), 0, stylingQuestion)
    }
    
    return res.status(200).json({
      questions: questions,
    })
  } catch (err) {
    console.error('Error analyzing idea:', err)
    // In case of error, still try to generate app-specific questions - but we lost access to request data
    // So return a generic set
    return res.status(500).json({
      error: 'Failed to analyze idea',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
