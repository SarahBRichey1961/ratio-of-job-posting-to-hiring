import { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY not found' })
    }

    // Test Claude API using SDK
    const client = new Anthropic({ apiKey })
    
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Claude API works via SDK!"',
        },
      ],
    })

    return res.status(200).json({
      success: true,
      message: message.content[0].type === 'text' ? message.content[0].text : 'No text response',
      method: 'SDK',
    })
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
      type: err.constructor.name,
      details: err.error || {},
    })
  }
}
