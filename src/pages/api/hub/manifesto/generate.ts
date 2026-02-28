import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSupabase } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, answers } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  if (!answers) {
    return res.status(400).json({ error: 'Answers required' })
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  try {
    // Build prompt for GPT to write the manifesto
    const prompt = `
You are a ghostwriter creating a compelling personal manifesto for a professional. 

Based on the following answers, write an authentic, powerful manifesto (300-400 words) that captures their essence, values, and vision. The manifesto should:
- Be written in first person
- Sound personal and authentic, not corporate
- Balance passion with professionalism
- Include specific details from their answers
- Be memorable and quotable
- End with a clear statement of their vision

Here are their answers:

**Professional Identity:** ${answers.professional_identity}

**Passions:** ${answers.passions}

**Key Accomplishment:** ${answers.accomplishment}

**Team Environment:** ${answers.team_environment}

**Non-Negotiables:** ${answers.boundaries}

**Next Phase:** ${answers.next_phase}

**5-Year Vision:** ${answers.five_year_vision}

Write the manifesto now. Make it powerful, personal, and true.`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert ghostwriter who creates compelling personal manifestos for professionals. Your writing is authentic, powerful, and memorable.',
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
