import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  idea: string
}

// Test endpoint for Claude code generation
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GENERATION_API_KEY = process.env.GENERATION_API_KEY

  if (!GENERATION_API_KEY) {
    return res.status(500).json({ error: 'GENERATION_API_KEY not configured' })
  }

  try {
    const { idea } = req.body as RequestBody

    if (!idea) {
      return res.status(400).json({ error: 'idea is required' })
    }

    console.log(`[TEST-CODEGEN] Received idea: ${idea}`)
    console.log(`[TEST-CODEGEN] API key length: ${GENERATION_API_KEY.length}`)

    const prompt = `Generate a simple Next.js React application for: ${idea}. Return ONLY a JSON array with 2-3 files.`

    console.log(`[TEST-CODEGEN] Calling Claude API...`)
    const startTime = Date.now()
    
    // Call Claude API with shorter timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': GENERATION_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
      // @ts-ignore
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const elapsed = Date.now() - startTime
    console.log(`[TEST-CODEGEN] Claude API responded in ${elapsed}ms`)

    if (!response.ok) {
      const err = await response.json()
      console.error(`[TEST-CODEGEN] Claude API error: ${JSON.stringify(err)}`)
      throw new Error(`Claude API failed: ${err.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log(`[TEST-CODEGEN] Response received`)
    
    const content = data.content[0].text

    // Return immediately with sample data
    return res.status(200).json({
      success: true,
      message: 'Code generation working',
      generationTime: elapsed,
      contentPreview: content.substring(0, 100),
    })
  } catch (err: any) {
    console.error(`[TEST-CODEGEN] Error: ${err.message}`)
    return res.status(500).json({
      error: err.message,
    })
  }
}

export default handler
