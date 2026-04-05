import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface RequestBody {
  appName: string
  appIdea: string
  targetUser?: string
  problemSolved?: string
  howItWorks?: string
  technologies?: string[]
  buildPlan?: string[]
}

async function buildAndDeploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME
  const GENERATION_API_KEY = process.env.GENERATION_API_KEY

  // Validate all required environment variables
  const missingVars = []
  if (!GITHUB_TOKEN) missingVars.push('GITHUB_TOKEN')
  if (!NETLIFY_TOKEN) missingVars.push('NETLIFY_TOKEN')
  if (!GITHUB_USERNAME) missingVars.push('GITHUB_USERNAME')
  if (!GENERATION_API_KEY) missingVars.push('GENERATION_API_KEY')

  if (missingVars.length > 0) {
    const errorMsg = `Missing environment variables: ${missingVars.join(', ')}. Set these in Netlify dashboard → Site settings → Environment`
    console.error(`❌ ${errorMsg}`)
    return res.status(500).json({ error: errorMsg })
  }

  try {
    console.log(`📨 Request body type: ${typeof req.body}`)
    console.log(`📨 Request body: ${JSON.stringify(req.body)}`)
    
    const req_body = req.body as RequestBody
    
    // Validate required fields
    if (!req_body) {
      console.error(`❌ req_body is null/undefined`)
      return res.status(400).json({
        error: 'Request body is missing',
      })
    }

    if (!req_body.appName || !req_body.appIdea) {
      console.error(`❌ Missing required fields. appName: ${req_body.appName}, appIdea: ${req_body.appIdea}`)
      return res.status(400).json({
        error: 'Missing required fields: appName and appIdea',
      })
    }
    
    // Use simplified flat format with smart defaults
    const appName = req_body.appName
    const appIdea = req_body.appIdea
    const targetUser = req_body.targetUser || 'General users'
    const problemSolved = req_body.problemSolved || appIdea
    const howItWorks = req_body.howItWorks || `${appName} provides a practical solution to help users accomplish their goals efficiently.`
    const technologies = req_body.technologies || ['React', 'TypeScript', 'Tailwind CSS', 'Next.js']
    const buildPlan = req_body.buildPlan || [
      'Setup Next.js project structure',
      'Create main UI components',
      'Implement core functionality',
      'Add styling with Tailwind',
      'Deploy to Netlify'
    ]

    let repoName = sanitizeRepoName(appName)
    console.log(`🚀 Building: ${appIdea}`)
    console.log(`📂 Repo: ${repoName}`)

    // 1. CREATE GITHUB REPO (auto-retry with suffix if name taken)
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

    // 3. USE AI TO GENERATE ACTUAL APPLICATION CODE
    console.log(`2️⃣ Using AI to generate application code...`)
    const generatedFiles = await generateApplicationCodeWithAI(
      GENERATION_API_KEY,
      appName,
      appIdea,
      targetUser,
      problemSolved,
      howItWorks,
      technologies,
      buildPlan
    )
    console.log(`✅ Generated ${generatedFiles.length} files`)

    // 4. PUSH ALL FILES TO GITHUB WITH AUTO-COMMITS
    console.log(`3️⃣ Pushing files to GitHub...`)
    for (const file of generatedFiles) {
      await pushFileToGitHub(GITHUB_TOKEN, repoFullName, file.path, file.content)
    }
    console.log(`✅ All files committed to GitHub`)

    // 5. CREATE NETLIFY SITE
    console.log(`4️⃣ Creating Netlify site...`)
    const siteData = await createNetlifySite(
      NETLIFY_TOKEN,
      repoName,
      GITHUB_USERNAME,
      repoName
    )
    const siteId = siteData.id
    const siteName = siteData.name || siteData.subdomain
    console.log(`✅ Site created: ${siteName}`)

    // 6. NETLIFY AUTO-BUILDS FROM GITHUB - Return immediately with URL
    console.log(`5️⃣ Netlify will auto-build from GitHub...`)
    // Don't wait for build completion - return the URL immediately
    // The site will be available as soon as Netlify finishes building (usually 1-2 minutes)
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

async function createRepo(
  token: string,
  name: string,
  description: string
): Promise<any> {
  const tokenPreview = token.substring(0, 15) + '***'
  console.log(`📤 Sending createRepo request to GitHub`)
  console.log(`   Name: ${name}`)
  console.log(`   Description: ${description}`)
  console.log(`   Token: ${tokenPreview}`)

  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: true,
    }),
  })

  console.log(`📥 GitHub response status: ${res.status}`)

  if (!res.ok) {
    let errorData: any
    const contentType = res.headers.get('content-type')
    
    try {
      errorData = contentType?.includes('application/json') 
        ? await res.json() 
        : { message: await res.text() }
    } catch {
      errorData = { message: `HTTP ${res.status}` }
    }

    console.error(`❌ GitHub API Error:`)
    console.error(`   Status: ${res.status}`)
    console.error(`   Response:`, errorData)

    if (res.status === 401) {
      throw new Error('GitHub authentication failed - invalid token')
    }
    if (res.status === 403) {
      throw new Error('GitHub access denied - check token permissions')
    }
    if (res.status === 422) {
      if (errorData.message?.includes('already exists')) {
        throw new Error(`Repo name already exists: ${name}`)
      }
      if (errorData.errors?.[0]?.message) {
        throw new Error(`GitHub validation error: ${errorData.errors[0].message}`)
      }
    }
    if (res.status === 429) {
      throw new Error('GitHub rate limit exceeded - try again in a few minutes')
    }

    throw new Error(`GitHub error: ${errorData.message || `HTTP ${res.status}`}`)
  }

  return res.json()
}

async function pushFileToGitHub(
  token: string,
  repoFullName: string,
  filePath: string,
  content: string
): Promise<void> {
  const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`
  const encoded = Buffer.from(content).toString('base64')

  // Try to get existing file SHA
  let sha: string | undefined
  try {
    const getRes = await fetch(url, {
      headers: { Authorization: `token ${token}` },
    })
    if (getRes.ok) {
      const data = await getRes.json()
      sha = data.sha
    }
  } catch (e) {
    console.warn(`  ⚠️ Could not check existing file ${filePath}`)
  }

  // Create or update file
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message: `Add ${filePath}`,
      content: encoded,
      branch: 'main',
      ...(sha && { sha }),
    }),
  })

  if (!putRes.ok) {
    const error = await putRes.json()
    const msg = error.message || putRes.statusText
    console.error(`  ❌ Failed to push ${filePath}: ${msg}`)
    throw new Error(`Failed to push ${filePath}: ${msg}`)
  }
  
  console.log(`  ✅ Pushed: ${filePath}`)
}

async function deployFilesToNetlify(
  token: string,
  siteId: string,
  files: Array<{ path: string; content: string }>
): Promise<string> {
  // 1. Calculate SHA1 hashes for each file
  const fileHashes: Record<string, string> = {}
  const hashToContent: Record<string, string> = {}

  for (const file of files) {
    const sha1 = crypto.createHash('sha1').update(file.content).digest('hex')
    const key = `/${file.path}`
    fileHashes[key] = sha1
    hashToContent[sha1] = file.content
  }

  // 2. Create a deploy with the file manifest
  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: fileHashes }),
    }
  )

  if (!deployRes.ok) {
    const err = await deployRes.json().catch(() => ({ message: `HTTP ${deployRes.status}` }))
    throw new Error(`Netlify deploy failed: ${err.message || deployRes.status}`)
  }

  const deploy = await deployRes.json()
  const deployId = deploy.id
  const required: string[] = deploy.required || []

  console.log(`   Deploy ${deployId} created, ${required.length} files to upload`)

  // 3. Upload each required file
  for (const sha of required) {
    const content = hashToContent[sha]
    const filePath = Object.entries(fileHashes).find(([, h]) => h === sha)?.[0]
    if (!content || !filePath) continue

    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      }
    )

    if (!uploadRes.ok) {
      console.warn(`   ⚠️ Upload failed for ${filePath}: ${uploadRes.status}`)
    } else {
      console.log(`   ✅ Uploaded: ${filePath}`)
    }
  }

  return deploy.deploy_ssl_url || deploy.ssl_url || deploy.url || ''
}

export default buildAndDeploy

// Generate actual application code using Claude AI
async function generateApplicationCodeWithAI(
  apiKey: string,
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  technologies: string[],
  buildPlan: string[]
): Promise<Array<{ path: string; content: string }>> {
  const prompt = `Generate a Next.js app. Return ONLY valid JSON (no markdown).

APP: ${appName}
IDEA: ${appIdea}
USER: ${targetUser}
TECH: ${technologies.join(', ')}

Generate 6 files as JSON: [{"path":"...", "content":"..."}]
1. package.json
2. tsconfig.json
3. next.config.js
4. pages/index.tsx - homepage
5. pages/_app.tsx - wrapper
6. README.md

Use TypeScript, React hooks, Tailwind. Return ONLY JSON array, nothing else.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Claude API failed: ${err.error?.message || response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Extract JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('Could not parse generated code from Claude')
  }

  const files = JSON.parse(jsonMatch[0])
  console.log(`✅ AI generated ${files.length} files`)
  return files
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

// Wait for Netlify to complete automatic build from GitHub
async function waitForNetlifyBuild(
  token: string,
  siteId: string,
  timeoutMs: number = 300000
): Promise<string> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) continue

      const deploys = await res.json()
      const latestDeploy = deploys[0]

      if (!latestDeploy) {
        await sleep(5000)
        continue
      }

      // Check if build is complete
      if (latestDeploy.state === 'ready') {
        const url = latestDeploy.ssl_url || latestDeploy.url || `https://${siteId}.netlify.app`
        console.log(`✅ Build complete: ${url}`)
        return url
      }

      if (latestDeploy.state === 'failed' || latestDeploy.state === 'error') {
        throw new Error(`Netlify build failed with state: ${latestDeploy.state}`)
      }

      console.log(`   Build in progress (${latestDeploy.state})...`)
      await sleep(5000)
    } catch (err) {
      console.log(`   Checking build status...`)
      await sleep(5000)
    }
  }

  throw new Error('Netlify build timed out')
}

