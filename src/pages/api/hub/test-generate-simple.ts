import { NextApiRequest, NextApiResponse } from 'next'

async function test(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST-GENERATE-SIMPLE] Request received')
  
  if (req.method !== 'POST') {
    console.log('[TEST-GENERATE-SIMPLE] Not POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('[TEST-GENERATE-SIMPLE] Parsing body')
  const body = req.body

  console.log(`[TEST-GENERATE-SIMPLE] Got appName: ${body.appName}`)
  console.log(`[TEST-GENERATE-SIMPLE] About to call AI...`)
  
  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      console.log('[TEST-GENERATE-SIMPLE] No API key')
      return res.status(500).json({ error: 'No API key' })
    }

    // Validate request body
    if (!body || !body.appName) {
      return res.status(400).json({ error: 'Missing appName in request body' })
    }

    console.log('[TEST-GENERATE-SIMPLE] Starting fetch...')
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      console.log('[TEST-GENERATE-SIMPLE] Aborting fetch')
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
            content: `Build app: ${body.appName}. Just respond with a valid JSON array of 2-3 files to create.`,
          },
        ],
      }),
      // @ts-ignore
      signal: controller.signal,
    })

    clearTimeout(timeout)
    console.log(`[TEST-GENERATE-SIMPLE] Response status: ${response.status}`)

    if (!response.ok) {
      const err = await response.json()
      console.log(`[TEST-GENERATE-SIMPLE] Error: ${JSON.stringify(err)}`)
      return res.status(500).json({ error: err })
    }

    const data = await response.json()
    console.log(`[TEST-GENERATE-SIMPLE] Got response`)

    return res.status(200).json({
      success: true,
      responseLength: data.content[0].text.length,
      message: 'Generated ok',
    })
  } catch (err: any) {
    console.log(`[TEST-GENERATE-SIMPLE] Caught error: ${err.message}`)
    if (err.name === 'AbortError') {
      console.log('[TEST-GENERATE-SIMPLE] Was abort error')
    }
    return res.status(500).json({ error: err.message })
  }
}

export default test
