import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GENERATION_API_KEY

  if (!apiKey) {
    return res.status(400).json({ error: 'GENERATION_API_KEY not found' })
  }

  // Test app generation prompt
  const prompt = `Generate a working Next.js app. Respond ONLY with JSON array.
App: TestApp - "A test application"
Users: "general users"
Problem: "testing the system"
Interests: "testing, quality assurance"

4 files as JSON only:
1. package.json - minimal
2. pages/index.tsx - simple working component
3. pages/_app.tsx - wrapper
4. README.md - description

[{"path":"package.json","content":"..."}...]`

  try {
    console.log('📨 Calling Claude API with app generation prompt...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    console.log('📥 Got response, status:', response.status)

    if (!response.ok) {
      const err = await response.json()
      console.error('❌ API error:', err)
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const content = data.content[0].text

    console.log('✅ Response received from Claude')
    console.log('   Length:', content.length)
    console.log('   First 500 chars:', content.substring(0, 500))
    console.log('   Last 300 chars:', content.substring(Math.max(0, content.length - 300)))

    // Try to parse as JSON
    let canParse = false
    let parseError = null
    try {
      JSON.parse(content)
      canParse = true
    } catch (e: any) {
      parseError = e.message
    }

    // Return the full response for analysis
    return res.status(200).json({
      success: true,
      length: content.length,
      canParse,
      parseError,
      first500: content.substring(0, 500),
      last300: content.substring(Math.max(0, content.length - 300)),
      fullResponse: content,
    })
  } catch (err: any) {
    console.error('❌ Exception:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
