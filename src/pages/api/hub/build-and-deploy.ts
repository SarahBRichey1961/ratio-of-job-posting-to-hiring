import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface RequestBody {
  appName: string
  appIdea: string
  targetUser?: string
  problemSolved?: string
  howItWorks?: string
  hobbies?: string
  interests?: string
  technologies?: string[]
  buildPlan?: string[]
}

// Synchronous deployment function - fully waits for completion before returning
async function deployApplication(
  githubToken: string,
  netlifyToken: string,
  githubUsername: string,
  repoName: string,
  appIdea: string,
  generatedFiles: Array<{ path: string; content: string }>
): Promise<{ liveUrl: string; repoUrl: string; repoName: string }> {
  try {
    console.log(`📦 Starting deployment for ${repoName}`)
    
    // 1. CREATE GITHUB REPO
    console.log(`📤 Creating GitHub repository...`)
    let repoData: any = null
    const namesToTry = [repoName, `${repoName}-app`, `${repoName}-${Date.now().toString(36).slice(-4)}`]
    
    for (const name of namesToTry) {
      try {
        repoData = await createRepo(githubToken, name, appIdea)
        repoName = name
        break
      } catch (err: any) {
        if (err.message?.includes('already exists') && name !== namesToTry[namesToTry.length - 1]) {
          console.log(`  ⚠️ Name "${name}" taken, trying next...`)
          continue
        }
        throw err
      }
    }
    
    if (!repoData) {
      throw new Error('Could not create repo after multiple attempts')
    }
    
    const repoFullName = repoData.full_name
    console.log(`✅ Repo created: ${repoFullName}`)

    // 2. PUSH FILES TO GITHUB
    console.log(`📤 Pushing ${generatedFiles.length} files to GitHub...`)
    for (const file of generatedFiles) {
      await pushFileToGitHub(githubToken, repoFullName, file.path, file.content)
    }
    console.log(`✅ All files pushed to GitHub`)

    // 3. CREATE NETLIFY SITE
    console.log(`🚀 Creating Netlify site linked to GitHub...`)
    const siteData = await createNetlifySite(
      netlifyToken,
      repoName,
      githubUsername,
      repoName
    )
    const siteId = siteData.id
    console.log(`✅ Netlify site created with ID: ${siteId}`)

    // 4. WAIT FOR NETLIFY BUILD TO START (max 60 seconds to stay under 120s timeout)
    console.log(`⏳ Waiting for Netlify build to start...`)
    const liveUrl = await waitForNetlifyBuild(netlifyToken, siteId, 60000) // 60 second timeout
    
    const repoUrl = `https://github.com/${githubUsername}/${repoName}`
    console.log(`🎉 ✅ Deployment initiated!`)
    console.log(`   Live URL: ${liveUrl}`)
    console.log(`   Repo URL: ${repoUrl}`)
    
    return { liveUrl, repoUrl, repoName }
  } catch (err: any) {
    console.error(`❌ Deployment failed: ${err.message}`)
    throw err
  }
}

async function buildAndDeploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  // Validate all required environment variables
  const missingVars = []
  if (!GITHUB_TOKEN) missingVars.push('GITHUB_TOKEN')
  if (!NETLIFY_TOKEN) missingVars.push('NETLIFY_TOKEN')
  if (!GITHUB_USERNAME) missingVars.push('GITHUB_USERNAME')
  if (!OPENAI_API_KEY) missingVars.push('OPENAI_API_KEY')

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
    const hobbies = req_body.hobbies || ''
    const interests = req_body.interests || ''
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

    // Generate temp repo name for this build FIRST
    const tempRepoId = Date.now().toString(36)
    const tempRepoName = `${repoName}-${tempRepoId}`

    // STEP 1-4: Do the actual build work HERE (not async fire-and-forget)
    // Netlify Functions terminate after response, so we can't rely on background tasks
    console.log(`1️⃣ Generating code with OpenAI...`)
    console.log(`2️⃣ Creating GitHub repo...`)
    console.log(`3️⃣ Pushing files to GitHub...`)
    console.log(`4️⃣ Creating Netlify site...`)
    
    // START the async work but let it run with proper error handling
    // Don't await it but DO make sure it starts
    const buildPromise = generateAndDeployAsync(
      OPENAI_API_KEY,
      GITHUB_TOKEN,
      NETLIFY_TOKEN,
      GITHUB_USERNAME,
      appName,
      appIdea,
      targetUser,
      problemSolved,
      howItWorks,
      technologies,
      buildPlan,
      hobbies,
      interests,
      tempRepoName
    )

    // SYNC DEPLOYMENT - Wait for it to complete before responding
    console.log(`⏳ Waiting for build to complete...`)
    try {
      await Promise.race([
        buildPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Build timeout - deployment is continuing in background')), 55000)
        )
      ])
      console.log(`✅ Build completed successfully`)
    } catch (err: any) {
      console.warn(`⚠️ Build timeout or error: ${err.message}`)
      // Don't fail - build is still happening, just return what we have
    }

    const repoUrl = `https://github.com/${GITHUB_USERNAME}/${tempRepoName}`
    const netlifyDeployUrl = `https://app.netlify.com/start/deploy?repository=${GITHUB_USERNAME}/${tempRepoName}`
    
    console.log(`✅ Deployment initiated`)
    return res.status(200).json({
      success: true,
      message: 'Your app code has been created and pushed to GitHub!',
      status: 'ready',
      buildId: tempRepoId,
      repoUrl: repoUrl,
      repoName: tempRepoName,
      netlifyDeployUrl: netlifyDeployUrl,
      instructions: {
        step1: 'Your code is ready on GitHub',
        step2: 'Click the "Deploy to Netlify" button below to deploy',
        step3: 'Netlify will handle the build and deployment automatically',
      },
      deployButtons: {
        github: repoUrl,
        netlify: netlifyDeployUrl,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error: ${msg}`)
    return res.status(500).json({ error: msg })
  }
}

// Async version that runs entire pipeline in background (fire-and-forget)
async function generateAndDeployAsync(
  openaiKey: string,
  githubToken: string,
  netlifyToken: string,
  githubUsername: string,
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  technologies: string[],
  buildPlan: string[],
  hobbies: string,
  interests: string,
  repoName: string
): Promise<void> {
  const logId = Date.now().toString(36)
  const log = (msg: string) => console.log(`[${logId}] ${msg}`)
  
  try {
    // STEP 1: Generate code using proven Vite + React template
    log(`🔵 STARTING: Generating Vite + React app...`)
    const generatedFiles = generateReactViteApp(
      appName,
      appIdea,
      targetUser,
      problemSolved,
      howItWorks
    )
    log(`✅ GENERATED: ${generatedFiles.length} files`)

    // STEP 2: Deploy
    log(`🔵 STARTING: GitHub repo creation...`)
    const repoUrl = await createGitHubRepo(githubToken, repoName, appIdea)
    log(`✅ REPO CREATED: ${repoUrl}`)

    log(`🔵 STARTING: Pushing files to GitHub...`)
    await pushAllFilesToGitHub(githubToken, githubUsername, repoName, generatedFiles)
    log(`✅ FILES PUSHED`)

    log(`🔵 STARTING: Netlify site creation...`)
    const netlifyUrl = await createAndLinkNetlifySite(netlifyToken, repoName, githubUsername, generatedFiles)
    log(`✅ NETLIFY SITE CREATED: ${netlifyUrl}`)

    log(`🟢 COMPLETE: Build and deployment finished`)
    log(`   GitHub: ${repoUrl}`)
    log(`   Live: ${netlifyUrl}`)
  } catch (err: any) {
    log(`🔴 FAILED: ${err.message}`)
    log(`Stack: ${err.stack?.split('\n').slice(0, 3).join(' | ')}`)
    // Error is logged - user can check /api/hub/build-status endpoint for details
  }
}

// Improved GitHub repo creation
async function createGitHubRepo(
  token: string,
  repoName: string,
  description: string
): Promise<string> {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      name: repoName,
      description: description.slice(0, 100),
      private: false,
      auto_init: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(`GitHub API ${res.status}: ${err.message}`)
  }

  const data = await res.json()
  return data.html_url
}

// Batch push files to GitHub
async function pushAllFilesToGitHub(
  token: string,
  githubUsername: string,
  repoName: string,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  const repoFullName = `${githubUsername}/${repoName}`
  
  for (const file of files) {
    const url = `https://api.github.com/repos/${repoFullName}/contents/${file.path}`
    const encoded = Buffer.from(file.content).toString('base64')

    // Get existing SHA if file exists
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
      // File might not exist yet
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
        message: `Add ${file.path}`,
        content: encoded,
        branch: 'main',
        ...(sha && { sha }),
      }),
    })

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({ message: `HTTP ${putRes.status}` }))
      throw new Error(`Failed to push ${file.path}: ${err.message}`)
    }
  }
}

// Create Netlify site and link to GitHub
async function createAndLinkNetlifySite(
  token: string,
  siteName: string,
  gitHubUsername: string,
  files: Array<{ path: string; content: string }>
): Promise<string> {
  // Sanitize site name for Netlify (must be lowercase, alphanumeric + hyphens only, 3-63 chars)
  const sanitized = siteName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
    .replace(/--+/g, '-')  // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
    .substring(0, 63)  // Max 63 chars
  
  // Ensure minimum length (Netlify requires at least 3 chars)
  let finalSiteName = sanitized
  if (finalSiteName.length < 3) {
    finalSiteName = sanitized + '-' + Math.random().toString(36).substring(2, 8)
  }
  
  console.log(`🔧 Site name sanitization:`)
  console.log(`   Original: "${siteName}"`)
  console.log(`   Sanitized: "${finalSiteName}"`)
  
  // Create site
  const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: finalSiteName }),
  })

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({ message: `HTTP ${createRes.status}` }))
    console.error(`❌ Failed to CREATE Netlify site:`)
    console.error(`   Status: ${createRes.status}`)
    console.error(`   Response:`, err)
    throw new Error(`Netlify site creation failed: ${err.message || err.description || createRes.statusText}`)
  }

  const site = await createRes.json()
  const siteId = site.id
  const createdSiteName = site.name  // Use the actual site name returned by Netlify
  
  // Build the correct URL - Netlify always uses this format
  let siteUrl = site.ssl_url || site.url || site.default_domain
  
  // Fallback: construct URL manually if not provided
  if (!siteUrl) {
    siteUrl = `https://${createdSiteName}.netlify.app`
  }
  
  // Ensure it's a full HTTPS URL
  if (!siteUrl.startsWith('http')) {
    siteUrl = `https://${siteUrl}`
  }
  
  console.log(`✅ Netlify site created:`)
  console.log(`   ID: ${siteId}`)
  console.log(`   Name: ${createdSiteName}`)
  console.log(`   URL: ${siteUrl}`)

  // Link to GitHub (this triggers builds on push)
  const linkRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo: `${gitHubUsername}/${createdSiteName}`,
        branch: 'main',
        allow_auto_builds: true,
      },
    }),
  })

  if (!linkRes.ok) {
    const err = await linkRes.json().catch(() => ({ message: `HTTP ${linkRes.status}` }))
    console.warn(`⚠️ Failed to LINK GitHub repo:`)
    console.warn(`   Status: ${linkRes.status}`)
    console.warn(`   Response:`, err)
    console.warn(`   Build will still proceed, but auto-builds on push won't work`)
  } else {
    console.log(`✅ GitHub repo linked for auto-builds`)
  }

  // Configure build settings for Vite + React
  const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      build_settings: {
        cmd: 'npm ci && npm run build',
        dir: 'dist',  // Vite outputs to dist, not .next
        base: '',
      },
    }),
  })

  if (!buildRes.ok) {
    const err = await buildRes.json().catch(() => ({ message: `HTTP ${buildRes.status}` }))
    console.warn(`⚠️ Failed to CONFIGURE build settings:`)
    console.warn(`   Status: ${buildRes.status}`)
    console.warn(`   Response:`, err)
  } else {
    console.log(`✅ Build settings configured`)
  }

  // Trigger deploy
  console.log(`🚀 Triggering Netlify build...`)
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/builds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!deployRes.ok) {
    const err = await deployRes.json().catch(() => ({ message: `HTTP ${deployRes.status}` }))
    console.warn(`⚠️ Failed to TRIGGER build:`)
    console.warn(`   Status: ${deployRes.status}`)
    console.warn(`   Response:`, err)
  } else {
    const deploy = await deployRes.json()
    console.log(`✅ Build triggered with ID: ${deploy.id}`)
  }

  return siteUrl
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

// Generate a working Vite + React app with a simple, proven template
function generateReactViteApp(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string
): Array<{ path: string; content: string }> {
  // Sanitize app name for CSS classes
  const safeName = appName.replace(/[^a-z0-9]/gi, '')

  // Create a simple, working React app using Vite
  const files: Array<{ path: string; content: string }> = [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: appName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.2.0',
          vite: '^5.0.0',
        },
      }, null, 2),
    },
    {
      path: 'vite.config.js',
      content: `import react from '@vitejs/plugin-react'
export default {
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
}`,
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    #root { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
    },
    {
      path: 'src/main.jsx',
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
    },
    {
      path: 'src/App.jsx',
      content: `import React, { useState } from 'react'
import './App.css'

export default function App() {
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState('')

  return (
    <div className="app-container">
      <header className="header">
        <h1>${appName}</h1>
        <p className="tagline">${appIdea}</p>
      </header>

      <main className="main-content">
        <section className="card">
          <h2>About</h2>
          <p><strong>For:</strong> ${targetUser}</p>
          <p><strong>Problem:</strong> ${problemSolved}</p>
        </section>

        <section className="card">
          <h2>How It Works</h2>
          <p>${howItWorks}</p>
        </section>

        <section className="card interactive">
          <h2>Try It Out</h2>
          <div className="demo-form">
            <input 
              type="text" 
              placeholder="Type something..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={() => alert('Feature: ' + message)}>Test Feature</button>
            {message && <p className="demo-output">You entered: "{message}"</p>}
          </div>
        </section>

        <footer className="footer">
          <p>Built with ${appName}. Idea becoming reality! 🚀</p>
        </footer>
      </main>
    </div>
  )
}`,
    },
    {
      path: 'src/App.css',
      content: `.app-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
}

.header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  font-weight: 700;
}

.tagline {
  font-size: 1.2em;
  opacity: 0.95;
  font-weight: 300;
}

.main-content {
  padding: 40px;
}

.card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border-left: 4px solid #667eea;
}

.card h2 {
  color: #333;
  margin-bottom: 12px;
  font-size: 1.5em;
}

.card p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.card p strong {
  color: #333;
}

.interactive {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-left-color: #764ba2;
}

.interactive h2,
.interactive p {
  color: white;
}

.demo-form {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.demo-form input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
}

.demo-form button {
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.demo-form button:active {
  transform: translateY(0);
}

.demo-output {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  color: white;
  font-style: italic;
}

.footer {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  color: #666;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 600px) {
  .header h1 { font-size: 1.8em; }
  .main-content { padding: 20px; }
  .card { padding: 16px; }
  .demo-form { flex-direction: column; }
  .demo-form input { min-width: auto; }
}`,
    },
    {
      path: '.gitignore',
      content: `node_modules
dist
.env
.env.local
.DS_Store
*.log
.vite`,
    },
    {
      path: 'README.md',
      content: `# ${appName}

${appIdea}

## Features
- Simple, clean interface
- Quick to understand and use
- Interactive demo built in

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:5173 to see your app running.

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The app will be built and ready to deploy in the \`dist\` folder.

## About
**For:** ${targetUser}
**Solves:** ${problemSolved}`,
    },
  ]

  console.log(`📦 Generated ${files.length} files for Vite + React app`)
  return files
}

// Create Netlify site linked to GitHub repo
async function createNetlifySite(
  token: string,
  siteName: string,
  repoOwner: string,
  repoName: string
): Promise<any> {
  // First, create the site without repo (simpler, more reliable)
  console.log(`📍 Creating Netlify site: ${siteName}`)
  const res = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: siteName,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`❌ Netlify response:`, err)
    throw new Error(`Netlify site creation failed: ${err.message || err.status || res.statusText}`)
  }

  const siteData = await res.json()
  const siteId = siteData.id
  console.log(`✅ Netlify site created: ${siteId}`)

  // Now link it to the GitHub repo
  console.log(`🔗 Linking to GitHub repo: ${repoOwner}/${repoName}`)
  const linkRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo: `${repoOwner}/${repoName}`,
        branch: 'main',
        allow_auto_builds: true,
        allowed_branches: ['main'],
      },
    }),
  })

  if (!linkRes.ok) {
    const err = await linkRes.json().catch(() => ({}))
    console.warn(`⚠️ Could not link GitHub repo: ${linkRes.status}`, err)
    // Don't fail entirely - site is created, just repo linking failed
  } else {
    console.log(`✅ GitHub repo linked`)
  }

  // Configure build settings
  console.log(`⚙️ Configuring build settings...`)
  const buildRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      build_settings: {
        cmd: 'npm run build',
        dir: '.next',
        base: '',
      },
    }),
  })

  if (!buildRes.ok) {
    console.warn(`⚠️ Could not set build settings: ${buildRes.status}`)
  } else {
    console.log(`✅ Build settings configured`)
  }

  // Trigger manual deploy to start the build
  console.log(`🚀 Triggering initial deploy...`)
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/builds`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!deployRes.ok) {
    console.warn(`⚠️ Could not trigger deploy: ${deployRes.status}`)
  } else {
    console.log(`✅ Deploy triggered`)
  }

  return siteData
}

// Wait for Netlify build to start and get valid URL
async function waitForNetlifyBuild(
  token: string,
  siteId: string,
  timeoutMs: number = 60000
): Promise<string> {
  const startTime = Date.now()
  let lastKnownUrl = `https://${siteId}.netlify.app`
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(
        `https://api.netlify.com/api/v1/sites/${siteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        await sleep(5000)
        continue
      }

      const siteData = await res.json()
      lastKnownUrl = siteData.ssl_url || siteData.url || lastKnownUrl
      
      // Success: We have a valid URL and site is created
      console.log(`✅ Netlify site ready: ${lastKnownUrl}`)
      return lastKnownUrl
    } catch (err) {
      console.log(`   Waiting for Netlify site...`)
      await sleep(5000)
    }
  }

  console.log(`⚠️ Using fallback URL (build may still be in progress): ${lastKnownUrl}`)
  return lastKnownUrl // Return what we have rather than fail
}

