import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY not found' })
    }

    // Test Claude API connection
    const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Claude API works!"',
          },
        ],
      }),
    })

    if (!testResponse.ok) {
      const error = await testResponse.json()
      return res.status(500).json({
        error: 'Claude API failed',
        details: error,
        statusCode: testResponse.status,
      })
    }

    const data = await testResponse.json()
    return res.status(200).json({
      success: true,
      message: data.content[0].text,
    })
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    })
  }
}
