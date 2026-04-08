import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.GENERATION_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'GENERATION_API_KEY not set' })
  }

  const prompt = `You are creating a production-ready Next.js web application. Return ONLY valid JSON.

SPECIFICATIONS:
- App Name: TestApp
- Core Purpose: A test application
- Target Users: General users
- Problem It Solves: Testing the system
- User Experience Flow: Simple test flow
- Technology Stack: React, TypeScript, Tailwind CSS, Next.js

REQUIREMENTS:
1. Generate a complete, working application
2. Include only 4 essential files

OUTPUT FORMAT - Return EXACTLY this JSON structure (no markdown, no code blocks, just pure JSON):
[{"path":"package.json","content":"{}"},{"path":"pages/index.tsx","content":"export default function Home() { return <div>Test</div> }"},{"path":"pages/_app.tsx","content":"export default function App({ Component, pageProps }) { return <Component {...pageProps} /> }"},{"path":"README.md","content":"# Test App"}]

Generate quality code matching the specifications.`

  try {
    console.log('📨 Sending request to Claude API...')
    console.log('    Model: claude-sonnet-4-6')
    console.log('    Prompt length:', prompt.length)

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

    console.log('📥 Claude API response status:', response.status)

    if (!response.ok) {
      const err = await response.json()
      console.error('❌ Claude API error:', err)
      return res.status(response.status).json({ error: err })
    }

    const data = await response.json()
    const content = data.content[0].text

    console.log('✅ Got response from Claude')
    console.log('   Response length:', content.length)
    console.log('   First 500 chars:', content.substring(0, 500))
    console.log('   Last 300 chars:', content.substring(Math.max(0, content.length - 300)))

    // Return the raw response for debugging
    return res.status(200).json({
      success: true,
      responseLength: content.length,
      firstChars: content.substring(0, 500),
      lastChars: content.substring(Math.max(0, content.length - 300)),
      fullResponse: content,
      canParse: (() => {
        try {
          JSON.parse(content)
          return 'yes'
        } catch {
          return 'no'
        }
      })(),
    })
  } catch (err: any) {
    console.error('❌ Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
