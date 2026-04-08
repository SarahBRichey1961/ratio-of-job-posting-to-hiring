import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { hobbies, interests } = req.body

  if (!hobbies && !interests) {
    return res.status(400).json({ error: 'Hobbies or interests required' })
  }

  const apiKey = process.env.GENERATION_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const prompt = `Generate 3 SPECIFIC, PROFITABLE app/SaaS ideas based on these interests:
Hobbies: ${hobbies || 'none'}
Interests: ${interests || 'none'}

CRITICAL: Return ONLY valid JSON, no other text:
[
  {
    "title": "App Name",
    "description": "One sentence description of what it does",
    "monetization": "How it makes money",
    "idea": "Full description for building: what problem it solves, how it works, key features"
  },
  ...
]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Claude error:', err)
      throw new Error(`Claude API: ${err.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const ideas = JSON.parse(jsonMatch[0])

    return res.status(200).json({ ideas })
  } catch (err: any) {
    console.error('Ideas generation error:', err.message)
    return res.status(500).json({ error: err.message || 'Failed to generate ideas' })
  }
}
