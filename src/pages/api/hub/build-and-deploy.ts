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
  questions?: string[]
  answers?: string[]
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
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

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

    // STEP 1: Generate custom app using Claude
    console.log(`\n1️⃣ Generating custom app with Claude...`)
    let customHtml = ''
    
    if (ANTHROPIC_API_KEY) {
      try {
        const claudeResponse = await generateCustomAppWithClaude(
          appName,
          appIdea,
          targetUser,
          problemSolved,
          howItWorks,
          ANTHROPIC_API_KEY,
          req_body.questions,
          req_body.answers
        )
        customHtml = claudeResponse
        console.log(`   ✅ Custom app generated (${customHtml.length} bytes)`)
      } catch (claudeErr) {
        console.warn(`   ⚠️ Claude generation failed, falling back to template:`, claudeErr instanceof Error ? claudeErr.message : String(claudeErr))
        customHtml = ''
      }
    } else {
      console.warn(`   ⚠️ ANTHROPIC_API_KEY not set, using template`)
    }

    // STEP 2: Generate files for deployment
    console.log(`\n2️⃣ Preparing deployment files...`)
    const files = customHtml 
      ? [{ path: 'index.html', content: customHtml }]
      : generateReactViteApp(appName, appIdea, targetUser, problemSolved, howItWorks)
    console.log(`   ✅ Generated ${files.length} files`)

    // STEP 3: Deploy to Netlify
    console.log(`\n3️⃣ Deploying to Netlify...`)
    const liveUrl = await deployToNetlifyDirect(NETLIFY_TOKEN, appName, files)
    console.log(`   ✅ Live at: ${liveUrl}`)

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
 * Generate custom app HTML using Claude
 */
async function generateCustomAppWithClaude(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string,
  apiKey: string,
  questions?: string[],
  answers?: string[]
): Promise<string> {
  // Build Q&A context if available
  let qaContext = ''
  if (questions && answers && questions.length > 0) {
    qaContext = '\n\nUSER\'S DETAILED ANSWERS TO CLARIFYING QUESTIONS:\n'
    questions.forEach((q, i) => {
      qaContext += `Q: ${q}\nA: ${answers?.[i] || 'Not answered'}\n\n`
    })
    qaContext += 'Use these specific answers to build an app that directly addresses their needs.'
  }

  const prompt = `You are an expert web developer. Generate a CUSTOM, FUNCTIONAL web app that matches THIS SPECIFIC request.

APP SPECIFICATION:
- Name: ${appName}
- Main Idea: ${appIdea}
- Target User: ${targetUser}
- Problem It Solves: ${problemSolved}
- How It Works: ${howItWorks}
${qaContext}

CRITICAL REQUIREMENTS:
1. Generate a COMPLETE, WORKING single-file HTML+CSS+JavaScript app
2. The app should be SPECIFIC to the problem/user/idea above - NOT generic
3. Make it functional and interactive
4. Include realistic features that address the stated problem
5. Use Tailwind CSS from CDN (https://cdn.tailwindcss.com)
6. Make it professional and polished
7. Include all CSS and JavaScript inline - no external files
8. Add a favicon (use inline SVG data URI)

RESPONSE: Return ONLY the complete HTML code, starting with <!DOCTYPE html>. No markdown. No code blocks. Just pure HTML.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  const htmlContent = data.content[0].text

  if (!htmlContent || !htmlContent.includes('<!DOCTYPE')) {
    throw new Error('Invalid HTML response from Claude')
  }

  return htmlContent
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
 * Generate a fallback app (used when Claude generation fails)
 * This is customized to show the problem/solution/target user at least
 */
function generateReactViteApp(
  appName: string,
  appIdea: string,
  targetUser: string,
  problemSolved: string,
  howItWorks: string
): Array<{ path: string; content: string }> {
  return [
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    #root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .app-container { max-width: 900px; width: 100%; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 700; }
    .tagline { font-size: 1.2em; opacity: 0.95; font-weight: 300; }
    .main-content { padding: 40px; }
    
    /* Form Wizard Styles */
    .form-step { display: none; }
    .form-step.active { display: block; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .form-step h2 { color: #333; margin-bottom: 8px; font-size: 1.5em; }
    .form-step p { color: #666; margin-bottom: 20px; }
    .form-step label { display: block; color: #333; font-weight: 500; margin-bottom: 8px; margin-top: 16px; }
    .form-step textarea, .form-step input[type="text"] { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1em; font-family: inherit; resize: vertical; min-height: 100px; }
    .form-step textarea:focus, .form-step input[type="text"]:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
    
    .form-buttons { display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end; }
    .btn-prev, .btn-next, .btn-launch { padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-prev { background: #e0e0e0; color: #333; }
    .btn-prev:hover { background: #d0d0d0; }
    .btn-next { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-next:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); }
    .btn-launch { background: linear-gradient(135deg, #00c853 0%, #1de9b6 100%); color: white; font-size: 1.1em; }
    .btn-launch:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0, 200, 83, 0.3); }
    .btn-launch:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* Step Indicators */
    .step { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0; color: #999; font-weight: 600; }
    .step.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    
    /* Summary */
    #summary { line-height: 1.8; }
    #summary strong { color: #667eea; }
    
    .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; border-top: 1px solid #e0e0e0; }
    @media (max-width: 600px) { .header h1 { font-size: 1.8em; } .main-content { padding: 20px; } .form-buttons { flex-direction: column; } }
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
        <div id="wizard">
          <div class="form-step active" data-step="1" style="display:block !important">
            <h2>Get Started</h2>
            <p style="color: #666; margin-bottom: 20px;">Tell us more about your ${appIdea}:</p>
            <textarea id="userInput" placeholder="Share your input here..." style="width:100%;padding:12px;border:2px solid #e0e0e0;border-radius:8px;min-height:120px;font-family:inherit;font-size:1em"></textarea>
            <div class="form-buttons" style="display:flex;gap:12px;margin-top:24px;justify-content:flex-end">
              <button class="btn-launch" onclick="submitForm()" style="background:linear-gradient(135deg,#00c853 0%,#1de9b6 100%);color:white;padding:12px 24px;border:none;border-radius:8px;font-weight:600;cursor:pointer">Submit</button>
            </div>
          </div>
          <div class="form-step" data-step="2" style="display:none;text-align:center;padding:40px 20px">
            <div style="font-size:3em;margin-bottom:12px">✓</div>
            <h2 style="color:#00c853">Submitted!</h2>
            <p style="color:#666;margin-top:12px">Thank you for using ${appName}</p>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script>
    function submitForm() {
      const input = document.getElementById('userInput').value;
      if (!input.trim()) {
        alert('Please enter something');
        return;
      }
      document.querySelector('.form-step[data-step="1"]').style.display = 'none';
      document.querySelector('.form-step[data-step="2"]').style.display = 'block';
    }
  </script>
  <footer style="text-align: center; padding: 20px; background: #f8f9fa; color: #666; border-top: 1px solid #e0e0e0; margin-top: 40px;">
    <p>Build your income-generating app with confidence and clarity</p>
    <p style="margin-top: 12px; font-size: 0.9em; color: #999;">${appName} • Built for ${targetUser}</p>
  </footer>
</body>
</html>`,
    },
  ]
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

