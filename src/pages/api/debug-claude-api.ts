import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GENERATION_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'GENERATION_API_KEY not set' })
  }

  const models = [
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
    'claude-haiku-4-5',
  ]

  const results: any = {}

  for (const model of models) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          max_tokens: 100,
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const data = await response.json()

      results[model] = {
        status: response.status,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type'),
        },
        response: data,
      }
    } catch (err: any) {
      results[model] = {
        error: err.message,
      }
    }
  }

  res.status(200).json({ results, apiKeySet: !!apiKey })
}
