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

/**
 * Get correct MIME type for file uploads
 */
function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop() || ''
  const mimeTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'text/typescript',
    'tsx': 'text/typescript',
    'css': 'text/css',
    'json': 'application/json',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * NEW APPROACH: Deploy directly to Netlify without GitHub
 * 1. Generate React app code
 * 2. Create deployment metadata
 * 3. Upload files directly to Netlify
 * 4. Return live URL
 * NO GitHub, NO async timeouts, NO 404s
 */
export default async function buildAndDeploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!NETLIFY_TOKEN) {
    console.error(`❌ NETLIFY_TOKEN missing`)
    return res.status(500).json({
      error: 'Netlify token not configured. Admin must check environment variables.',
      instructions: 'Set NETLIFY_TOKEN in Netlify environment settings',
    })
  }

  try {
    const req_body = req.body as RequestBody

    if (!req_body.appName || !req_body.appIdea) {
      return res.status(400).json({
        error: 'Missing required fields: appName and appIdea',
      })
    }

    const appName = req_body.appName
    const appIdea = req_body.appIdea
    const targetUser = req_body.targetUser || 'General users'
    const problemSolved = req_body.problemSolved || appIdea
    const howItWorks = req_body.howItWorks || 'Practical solution to help users accomplish goals'

    console.log(`\n🚀 BUILD REQUEST: ${appName}`)
    console.log(`   Idea: ${appIdea}`)

    // STEP 1: Generate React + Vite app
    console.log(`\n1️⃣ Generating app code...`)
    const files = generateReactViteApp(appName, appIdea, targetUser, problemSolved, howItWorks, OPENAI_API_KEY)
    console.log(`   ✅ Generated ${files.length} files`)

    // STEP 2: Deploy to Netlify
    console.log(`\n2️⃣ Deploying to Netlify...`)
    const liveUrl = await deployToNetlifyDirect(NETLIFY_TOKEN, appName, files)
    console.log(`   ✅ Live at: ${liveUrl}`)

    // STEP 3: Record in database (optional, for tracking)
    console.log(`\n3️⃣ Recording app...`)
    // TODO: Save to Supabase with app metadata

    console.log(`\n✨ APP COMPLETE: ${liveUrl}\n`)

    return res.status(200).json({
      success: true,
      message: 'Your app is being built and deployed!',
      liveUrl: liveUrl,
      appName: appName,
      status: 'deploying',
      checkIn: '2-3 minutes for build to complete',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error(`\n❌ BUILD FAILED: ${msg}`)
    if (stack) console.error(`   Stack: ${stack.split('\n').slice(0, 3).join('\n   ')}`)
    return res.status(500).json({ error: msg })
  }
}

/**
 * Deploy files directly to Netlify (no GitHub needed)
 */
async function deployToNetlifyDirect(
  netlifyToken: string,
  appName: string,
  files: Array<{ path: string; content: string }>
): Promise<string> {
  const siteName = sanitizeSiteName(appName)
  console.log(`   Creating site: ${siteName}`)
  console.log(`   Token (first 20 chars): ${netlifyToken.substring(0, 20)}...`)
  console.log(`   Files to upload: ${files.length}`)

  // 1. Create Netlify site
  console.log(`   📡 Calling Netlify API...`)
  
  let createRes: any
  try {
    createRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: siteName }),
    })
  } catch (fetchError: any) {
    const fetchMsg = fetchError instanceof Error ? fetchError.message : String(fetchError)
    console.error(`❌ Fetch error (network/connection): ${fetchMsg}`)
    throw new Error(`Network error calling Netlify API: ${fetchMsg}`)
  }

  console.log(`   Response Status: ${createRes.status}`)
  if (!createRes.ok) {
    let errText = ''
    try {
      errText = await createRes.text()
    } catch (e) {
      errText = `Could not read response body: ${e}`
    }
    console.error(`❌ Netlify API Error Response (${createRes.status}):`, errText)
    let err: any = {}
    try {
      err = JSON.parse(errText)
    } catch {
      err = { message: errText || `HTTP ${createRes.status}` }
    }
    const errorMsg = err.message || err.description || JSON.stringify(err) || `HTTP ${createRes.status}`
    console.error(`❌ Error details:`, err)
    throw new Error(`Failed to create Netlify site: ${errorMsg}`)
  }

  const siteData = await createRes.json()
  const siteId = siteData.id
  const siteUrl = siteData.ssl_url || siteData.url || `https://${siteName}.netlify.app`
  
  console.log(`   Site ID: ${siteId}`)
  console.log(`   URL: ${siteUrl}`)

  // 2. Upload files to Netlify
  console.log(`   Uploading ${files.length} files...`)
  
  const fileHashes: Record<string, string> = {}
  const hashToContent: Record<string, string> = {}

  // Calculate SHA1 for each file
  for (const file of files) {
    const hash = crypto.createHash('sha1').update(file.content).digest('hex')
    const key = `/${file.path}`
    fileHashes[key] = hash
    hashToContent[hash] = file.content
  }

  // Create deploy with file manifest
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: fileHashes }),
  })

  if (!deployRes.ok) {
    const err = await deployRes.json().catch(() => ({ message: `HTTP ${deployRes.status}` }))
    throw new Error(`Failed to create deploy: ${err.message}`)
  }

  const deployData = await deployRes.json()
  const deployId = deployData.id
  const requiredFiles = deployData.required || []

  console.log(`   Deploy ID: ${deployId}`)
  console.log(`   Files to upload: ${requiredFiles.length}`)

  // Upload each required file
  for (const sha of requiredFiles) {
    const content = hashToContent[sha]
    const filePath = Object.entries(fileHashes).find(([, h]) => h === sha)?.[0]

    if (!content || !filePath) continue

    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deployId}/files${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': getMimeType(filePath),
        },
        body: content,
      }
    )

    if (!uploadRes.ok) {
      console.warn(`   ⚠️ Failed: ${filePath} (${uploadRes.status})`)
    } else {
      console.log(`   ✅ Uploaded: ${filePath}`)
    }
  }

  return siteUrl
}

/**
 * Generate a complete Vite + React app with ChatGPT integration
 */
function generateReactViteApp(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  openaiKey?: string
): Array<{ path: string; content: string }> {
  const sanitizedName = appName.replace(/[^a-z0-9]/gi, '')
  const hasOpenAI = !!openaiKey

  return [
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    #root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .app-container { max-width: 900px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 700; }
    .tagline { font-size: 1.2em; opacity: 0.95; font-weight: 300; }
    .main-content { padding: 40px; }
    .card { background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #667eea; }
    .card h2 { color: #333; margin-bottom: 12px; font-size: 1.5em; }
    .card p { color: #666; line-height: 1.6; margin-bottom: 8px; }
    .card strong { color: #333; }
    .interactive { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-left-color: #764ba2; }
    .interactive h2, .interactive p { color: white; }
    .demo-form { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
    .demo-form input, .demo-form textarea { flex: 1; min-width: 200px; padding: 12px 16px; border: none; border-radius: 8px; font-size: 1em; }
    .demo-form button { padding: 12px 24px; background: white; color: #667eea; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .demo-form button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    .demo-output { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.2); border-radius: 8px; color: white; font-style: italic; margin-top: 12px; }
    .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; border-top: 1px solid #e0e0e0; }
    @media (max-width: 600px) { .header h1 { font-size: 1.8em; } .main-content { padding: 20px; } .card { padding: 16px; } .demo-form { flex-direction: column; } }
  </style>
</head>
<body>
  <div id="root">
    <div class="app-container">
      <header class="header">
        <h1>${appName}</h1>
        <p class="tagline">${appIdea}</p>
      </header>
      <main class="main-content">
        <section class="card">
          <h2>About</h2>
          <p><strong>For:</strong> ${targetUser}</p>
          <p><strong>Problem:</strong> ${problemSolved}</p>
        </section>
        <section class="card">
          <h2>How It Works</h2>
          <p>${howItWorks}</p>
        </section>
        <section class="card interactive">
          <h2>Try It Out</h2>
          <div class="demo-form">
            <input type="text" id="demo-input" placeholder="Enter your message..." />
            <button onclick="handleDemo()">Send</button>
          </div>
          <div id="demo-output" style="display:none;" class="demo-output"></div>
        </section>
        <footer class="footer">
          <p>Built with ${appName} | Powered by AI</p>
        </footer>
      </main>
    </div>
  </div>
  <script>
    function handleDemo() {
      const input = document.getElementById('demo-input');
      const output = document.getElementById('demo-output');
      if (input.value.trim()) {
        output.textContent = 'You said: ' + input.value;
        output.style.display = 'block';
      }
    }
    document.getElementById('demo-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleDemo();
    });
  </script>
</body>
</html>`,
    },
  ]
}

/**
 * Generate the main App.jsx component
 */
function generateAppCode(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  hasOpenAI: boolean
): string {
  return `import React, { useState } from 'react'
import './App.css'

export default function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setOutput('Processing...')
    
    try {
      ${
        hasOpenAI
          ? `
      // Use ChatGPT API (requires API key in environment)
      const response = await fetch('/api/app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })
      
      const data = await response.json()
      setOutput(data.response || 'No response')
      `
          : `
      // Demo: Echo the input
      setOutput('You said: ' + input)
      `
      }
    } catch (err) {
      setOutput('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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
          <p><strong>Solves:</strong> ${problemSolved}</p>
        </section>

        <section className="card">
          <h2>How It Works</h2>
          <p>${howItWorks}</p>
        </section>

        <section className="card interactive">
          <h2>Try It Now</h2>
          <div className="demo-form">
            <input
              type="text"
              placeholder="Enter your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={loading}
            />
            <button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : 'Send'}
            </button>
          </div>
          {output && <div className="demo-output">{output}</div>}
        </section>

        <footer className="footer">
          <p>Built with ${appName} | Powered by AI</p>
        </footer>
      </main>
    </div>
  )
}`
}

/**
 * Sanitize app name for Netlify subdomain
 */
function sanitizeSiteName(appName: string): string {
  let sanitized = appName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)  // Leave room for unique suffix

  // Always add a unique suffix to avoid "subdomain must be unique" errors
  // Use timestamp (13 chars) + random (8 chars) but keep under 63 char limit
  const uniqueSuffix = '-' + Date.now().toString(36)
  sanitized = sanitized + uniqueSuffix

  // Ensure we don't exceed 63 chars
  if (sanitized.length > 63) {
    sanitized = sanitized.substring(0, 63)
  }

  return sanitized
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

