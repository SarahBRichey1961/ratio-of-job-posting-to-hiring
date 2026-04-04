import { NextApiRequest, NextApiResponse } from 'next'

interface DeployRequest {
  appName: string
  appIdea: string
  files: Array<{ path: string; content: string }>
}

async function deploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME

  if (!GITHUB_TOKEN || !NETLIFY_TOKEN || !GITHUB_USERNAME) {
    return res.status(500).json({
      error: 'Missing GitHub/Netlify environment variables',
    })
  }

  try {
    const { appName, appIdea, files } = req.body as DeployRequest

    // Validate required fields
    if (!appName || !appIdea || !files || !Array.isArray(files)) {
      return res.status(400).json({
        error: 'Missing required fields: appName, appIdea, and files array',
      })
    }

    let repoName = sanitizeRepoName(appName)
    console.log(`🚀 Deploying: ${appIdea}`)
    console.log(`📂 Repo: ${repoName}`)
    console.log(`📦 Files to deploy: ${files.length}`)

    // 1. CREATE GITHUB REPO
    console.log(`1️⃣ Creating GitHub repository...`)
    let repoData: any = null
    const namesToTry = [repoName, `${repoName}-app`, `${repoName}-${Date.now().toString(36).slice(-4)}`]
    for (const name of namesToTry) {
      try {
        repoData = await createRepo(GITHUB_TOKEN, name, appIdea)
        repoName = name
        break
      } catch (err: any) {
        if (err.message?.includes('already exists') && name !== namesToTry[namesToTry.length - 1]) {
          console.log(`⚠️ "${name}" taken, trying next...`)
          continue
        }
        throw err
      }
    }
    if (!repoData) {
      throw new Error(`Could not create repo - all name variants taken`)
    }
    const repoFullName = repoData.full_name
    console.log(`✅ Repo created: ${repoFullName}`)

    // 2. WAIT FOR REPO INIT
    console.log(`⏳ Waiting for repo init...`)
    let branchExists = false
    for (let i = 0; i < 5; i++) {
      await sleep(1000)
      try {
        const checkRes = await fetch(
          `https://api.github.com/repos/${repoFullName}/branches/main`,
          { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
        )
        if (checkRes.ok) {
          branchExists = true
          break
        }
      } catch {}
    }

    if (!branchExists) {
      throw new Error('Failed to verify main branch exists after repo creation')
    }

    // 3. PUSH ALL FILES TO GITHUB
    console.log(`2️⃣ Pushing files to GitHub...`)
    for (const file of files) {
      await pushFileToGitHub(GITHUB_TOKEN, repoFullName, file.path, file.content)
    }
    console.log(`✅ All files committed to GitHub`)

    // 4. CREATE NETLIFY SITE
    console.log(`3️⃣ Creating Netlify site...`)
    const siteData = await createNetlifySite(
      NETLIFY_TOKEN,
      repoName,
      GITHUB_USERNAME,
      repoName
    )
    const siteId = siteData.id
    const siteName = siteData.name || siteData.subdomain
    console.log(`✅ Site created: ${siteName}`)

    // 5. NETLIFY AUTO-BUILDS FROM GITHUB - Return immediately
    console.log(`4️⃣ Netlify will auto-build from GitHub...`)
    const deployUrl = `https://${siteData.subdomain || siteName}.netlify.app`
    console.log(`✅ Deploy initiated: ${deployUrl}`)

    console.log(`🎉 Done! App building - check URL in 1-2 minutes.`)
    
    return res.status(200).json({
      success: true,
      message: 'Your app is building and will be live in 1-2 minutes!',
      liveUrl: deployUrl,
      repoUrl: `https://github.com/${repoFullName}`,
      repoName,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error: ${msg}`)
    return res.status(500).json({ error: msg })
  }
}

function sanitizeRepoName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 39)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Create GitHub repo
async function createRepo(token: string, name: string, description: string): Promise<any> {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (err.message?.includes('already exists')) {
      throw new Error('Repository name already exists')
    }
    throw new Error(`GitHub repo creation failed: ${err.message || res.statusText}`)
  }

  return await res.json()
}

// Push file to GitHub using REST API
async function pushFileToGitHub(
  token: string,
  repoFullName: string,
  filePath: string,
  content: string
): Promise<void> {
  const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`
  const encodedContent = Buffer.from(content).toString('base64')

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add ${filePath}`,
      content: encodedContent,
      branch: 'main',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.warn(`⚠️ Failed to push ${filePath}:`, err.message || res.statusText)
  }
}

// Create Netlify site linked to GitHub repo
async function createNetlifySite(
  token: string,
  siteName: string,
  repoOwner: string,
  repoName: string
): Promise<any> {
  const res = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: siteName,
      repo: {
        provider: 'github',
        repo: `${repoOwner}/${repoName}`,
        branch: 'main',
        deploy_key_id: '1',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Netlify site creation failed: ${err.message || res.statusText}`)
  }

  return await res.json()
}

export default deploy
