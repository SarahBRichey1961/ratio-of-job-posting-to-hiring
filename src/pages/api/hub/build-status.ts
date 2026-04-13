import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Debug endpoint to check environment variables and Netlify token validity
 */
export default async function buildStatus(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  const status: any = {
    timestamp: new Date().toISOString(),
    environment: {
      GITHUB_TOKEN: GITHUB_TOKEN ? '✅ SET' : '❌ MISSING',
      NETLIFY_TOKEN: NETLIFY_TOKEN ? '✅ SET' : '❌ MISSING',
      GITHUB_USERNAME: GITHUB_USERNAME ? `✅ SET (${GITHUB_USERNAME})` : '❌ MISSING',
      OPENAI_API_KEY: OPENAI_API_KEY ? '✅ SET' : '❌ MISSING',
    },
    missingVars: [] as string[],
  }

  if (!GITHUB_TOKEN) status.missingVars.push('GITHUB_TOKEN')
  if (!NETLIFY_TOKEN) status.missingVars.push('NETLIFY_TOKEN')
  if (!GITHUB_USERNAME) status.missingVars.push('GITHUB_USERNAME')
  if (!OPENAI_API_KEY) status.missingVars.push('OPENAI_API_KEY')

  // Test Netlify token if it exists
  if (NETLIFY_TOKEN) {
    try {
      const netlifyTest = await fetch('https://api.netlify.com/api/v1/user', {
        headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
      })
      status.netlify = {
        tokenValid: netlifyTest.ok,
        status: netlifyTest.status,
        message: netlifyTest.ok ? 'Token is valid' : `Invalid token (${netlifyTest.status})`,
      }
    } catch (err) {
      status.netlify = {
        tokenValid: false,
        message: 'Could not test Netlify token',
      }
    }
  }

  // Test GitHub token if it exists
  if (GITHUB_TOKEN) {
    try {
      const githubTest = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      })
      status.github = {
        tokenValid: githubTest.ok,
        status: githubTest.status,
        message: githubTest.ok ? 'Token is valid' : `Invalid token (${githubTest.status})`,
      }
    } catch (err) {
      status.github = {
        tokenValid: false,
        message: 'Could not test GitHub token',
      }
    }
  }

  if (status.missingVars.length > 0) {
    return res.status(400).json({
      ...status,
      error: `Missing required environment variables: ${status.missingVars.join(', ')}`,
      instructions: 'Set these in Netlify → Site Settings → Build & Deploy → Environment',
    })
  }

  return res.status(200).json({
    ...status,
    message: 'All environment variables are set and tokens appear valid',
  })
}
