import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GENERATION_API_KEY || ''

  const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello' }],
    }),
  })

  const responseText = await testResponse.text()
  const responseJson = (() => {
    try {
      return JSON.parse(responseText)
    } catch {
      return null
    }
  })()

  res.status(200).json({
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey.length,
    apiKeyStart: apiKey.substring(0, 10),
    responseStatus: testResponse.status,
    responseOk: testResponse.ok,
    responseText: responseText.substring(0, 500),
    responseParsed: responseJson,
  })
}
