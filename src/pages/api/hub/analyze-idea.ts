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
      console.error('Failed to generate dynamic questions')
      // Fallback to basic questions if OpenAI fails
      return res.status(200).json({
        questions: [
          'What are the top 3 features that would make users love this app?',
          'Who is your biggest competitor and how would you differentiate?',
          'What is your primary monetization strategy?',
          'What technology stack would work best for this?',
          'What would success look like in the first 3 months?',
          'What is the biggest technical challenge you foresee?',
        ],
      })
    }

    const data = await generateResponse.json()
    return res.status(200).json({
      questions: data.questions || [],
    })
  } catch (err) {
    console.error('Error analyzing idea:', err)
    // Fallback to basic questions
    return res.status(200).json({
      questions: [
        'What are the top 3 features that would make users love this app?',
        'Who is your biggest competitor and how would you differentiate?',
        'What is your primary monetization strategy?',
        'What technology stack would work best for this?',
        'What would success look like in the first 3 months?',
        'What is the biggest technical challenge you foresee?',
      ],
    })
  }
}
