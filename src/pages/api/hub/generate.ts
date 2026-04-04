import { NextApiRequest, NextApiResponse } from 'next'

async function generate(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body

  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'No API key' })
    }

    // Validate request body
    if (!body || !body.appName || !body.appIdea) {
      return res.status(400).json({ error: 'Missing appName or appIdea' })
    }

    const { appName, appIdea } = body

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, 40000)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Build a Next.js app for: ${appIdea}`,
          },
        ],
      }),
      // @ts-ignore
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: err })
    }

    const data = await response.json()

    return res.status(200).json({
      success: true,
      message: `Generated ${appName}`,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default generate

