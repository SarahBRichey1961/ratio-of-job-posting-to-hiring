import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return res.status(400).json({
        error: 'ANTHROPIC_API_KEY not found in environment',
      })
    }

    return res.status(200).json({
      keyExists: true,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 15),
      keySuffix: apiKey.substring(apiKey.length - 10),
      fullKey: apiKey, // Debug only
      env: {
        ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
        GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
        NETLIFY_TOKEN: !!process.env.NETLIFY_TOKEN,
        GITHUB_USERNAME: !!process.env.GITHUB_USERNAME,
      },
    })
  } catch (err: any) {
    return res.status(500).json({
      error: err.message,
    })
  }
}
