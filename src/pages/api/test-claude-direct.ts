import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GENERATION_API_KEY

  if (!apiKey) {
    return res.status(400).json({
      error: 'GENERATION_API_KEY not found',
      env: {
        GENERATION_API_KEY: !!process.env.GENERATION_API_KEY,
      },
    })
  }

  console.log(`\n🧪 TESTING CLAUDE API DIRECT`)
  console.log(`📝 API Key length: ${apiKey.length}`)
  console.log(`📝 Key starts with: ${apiKey.substring(0, 20)}`)

  const models = [
    'claude-opus',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3.5-sonnet',
    'claude-3-5-sonnet-20241022',
  ]

  const results: any = {}

  for (const model of models) {
    try {
      console.log(`\n🔍 Testing model: ${model}`)

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
          messages: [
            {
              role: 'user',
              content: 'Say hello',
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`❌ Model ${model} failed: ${response.status}`)
        console.error(`   Error:`, data)
        results[model] = {
          status: response.status,
          error: data.error?.message || data.error?.type || JSON.stringify(data),
        }
      } else {
        console.log(`✅ Model ${model} WORKS!`)
        results[model] = {
          status: response.status,
          success: true,
          message: data.content?.[0]?.text?.substring(0, 50),
        }
      }
    } catch (err: any) {
      console.error(`❌ Model ${model} exception:`, err.message)
      results[model] = {
        error: err.message,
      }
    }
  }

  return res.status(200).json({
    tested: models,
    results,
    recommendation: Object.entries(results).find(([_, v]: any) => v.success)?.[0] || 'NONE WORKED',
  })
}
