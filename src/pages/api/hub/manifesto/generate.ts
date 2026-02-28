import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, questions } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Questions required' })
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    // Build question/answer pairs for the prompt
    const questionAnswerPairs = questions
      .map((q, index) => `**Q${index + 1}: ${q.question}**\n${q.answer}`)
      .join('\n\n')

    // Build prompt for GPT to write the manifesto
    const prompt = `
You are a ghostwriter creating a compelling personal manifesto for a professional. 

Based on the following answers to their custom questions, write an authentic, powerful manifesto (300-400 words) that captures their essence, values, and vision. The manifesto should:
- Be written in first person
- Sound personal and authentic, not corporate
- Balance passion with professionalism
- Include specific details from their answers
- Be memorable and quotable
- End with a clear statement of their vision
- Respect the unique questions they chose to answer

Here are their answers:

${questionAnswerPairs}

Write the manifesto now. Make it powerful, personal, and true.`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert ghostwriter who creates compelling personal manifestos for professionals. Your writing is authentic, powerful, and memorable. Respect the questions they chose to answer and write to their unique voice and perspective.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const manifesto = response.data.choices[0]?.message?.content

    if (!manifesto) {
      return res.status(500).json({ error: 'Failed to generate manifesto' })
    }

    // Generate a URL slug from the user ID (you can fetch username later)
    const url = `https://takethereins.ai/manifesto/${userId}`

    return res.status(200).json({
      manifesto,
      url,
      preview: manifesto.substring(0, 150) + '...',
    })
  } catch (error: any) {
    console.error('Error generating manifesto:', error)
    return res.status(500).json({
      error: error.message || 'Failed to generate manifesto',
    })
  }
}

