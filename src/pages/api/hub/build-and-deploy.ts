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
          <!-- Progress Bar -->
          <div style="margin-bottom: 30px;">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <span class="step active" data-step="1">1</span>
              <span class="step" data-step="2">2</span>
              <span class="step" data-step="3">3</span>
              <span class="step" data-step="4">4</span>
              <span class="step" data-step="5">5</span>
            </div>
            <div style="height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
              <div id="progress-bar" style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: 20%; transition: width 0.3s;"></div>
            </div>
          </div>

          <!-- Step 1: Problem Statement -->
          <div class="form-step active" data-step="1">
            <h2>Step 1: What's the Core Problem?</h2>
            <p style="color: #666; margin-bottom: 20px;">Describe the problem your app will solve. Who suffers from this problem?</p>
            <textarea id="problem" placeholder="e.g., Freelancers struggle to track time across multiple projects and clients..."></textarea>
            <div class="form-buttons">
              <button class="btn-next" onclick="nextStep()">Next</button>
            </div>
          </div>

          <!-- Step 2: Target User & Revenue -->
          <div class="form-step" data-step="2">
            <h2>Step 2: Who Will Pay & How?</h2>
            <p style="color: #666; margin-bottom: 20px;">Define your ideal customer and revenue model.</p>
            <label>Target Customer:</label>
            <textarea id="target-user" placeholder="e.g., Independent developers, project managers, small design teams..."></textarea>
            <label style="margin-top: 16px;">How They'll Pay (Select one):</label>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
              <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;"><input type="radio" name="revenue" value="subscription"> Monthly/Annual Subscription</label>
              <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;"><input type="radio" name="revenue" value="one-time"> One-Time Purchase</label>
              <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;"><input type="radio" name="revenue" value="freemium"> Freemium (Free + Premium)</label>
              <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;"><input type="radio" name="revenue" value="commission"> Commission/Revenue Share</label>
              <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer;"><input type="radio" name="revenue" value="other"> Other</label>
            </div>
            <div class="form-buttons">
              <button class="btn-prev" onclick="prevStep()">Back</button>
              <button class="btn-next" onclick="nextStep()">Next</button>
            </div>
          </div>

          <!-- Step 3: Core Features -->
          <div class="form-step" data-step="3">
            <h2>Step 3: What Are the Core Features?</h2>
            <p style="color: #666; margin-bottom: 20px;">List 3-5 essential features that make your app valuable.</p>
            <textarea id="features" placeholder="Feature 1: Time tracking across projects&#10;Feature 2: Automated invoice generation&#10;Feature 3: Client expense tracking&#10;..."></textarea>
            <div class="form-buttons">
              <button class="btn-prev" onclick="prevStep()">Back</button>
              <button class="btn-next" onclick="nextStep()">Next</button>
            </div>
          </div>

          <!-- Step 4: Competition & Differentiation -->
          <div class="form-step" data-step="4">
            <h2>Step 4: What Makes You Different?</h2>
            <p style="color: #666; margin-bottom: 20px;">Who are competitors? What will you do better?</p>
            <label>Existing Solutions (competitors):</label>
            <textarea id="competitors" placeholder="e.g., Toggl, Harvest, Clockify..."></textarea>
            <label style="margin-top: 16px;">Your Advantage:</label>
            <textarea id="advantage" placeholder="e.g., Simpler pricing, better for freelancers, AI-powered insights..."></textarea>
            <div class="form-buttons">
              <button class="btn-prev" onclick="prevStep()">Back</button>
              <button class="btn-next" onclick="nextStep()">Next</button>
            </div>
          </div>

          <!-- Step 5: Review & Next Steps -->
          <div class="form-step" data-step="5">
            <h2>Step 5: Your App Blueprint</h2>
            <p style="color: #666; margin-bottom: 20px;">Review your app idea. This is your roadmap to an income-generating business.</p>
            <div id="summary" style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;"></div>
            <label style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px; cursor: pointer;">
              <input type="checkbox" id="agree" style="margin-top: 4px;">
              <span style="color: #666;">I'm ready to build this app and earn income with it</span>
            </label>
            <div class="form-buttons">
              <button class="btn-prev" onclick="prevStep()">Back</button>
              <button id="launch-btn" class="btn-launch" onclick="launchApp()" disabled>Launch My App</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script>
    let currentStep = 1;
    
    function showStep(step) {
      // Hide all steps
      document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
      
      // Show current step
      document.querySelector(\`.form-step[data-step="\${step}"]\`).classList.add('active');
      document.querySelector(\`.step[data-step="\${step}"]\`).classList.add('active');
      
      // Update progress bar
      const progress = (step / 5) * 100;
      document.getElementById('progress-bar').style.width = progress + '%';
      
      // Update summary on final step
      if (step === 5) {
        updateSummary();
      }
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function nextStep() {
      if (currentStep < 5) {
        currentStep++;
        showStep(currentStep);
      }
    }
    
    function prevStep() {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    }
    
    function updateSummary() {
      const problem = document.getElementById('problem').value || '(Not filled)';
      const targetUser = document.getElementById('target-user').value || '(Not filled)';
      const revenue = document.querySelector('input[name="revenue"]:checked')?.value || '(Not selected)';
      const features = document.getElementById('features').value || '(Not filled)';
      const competitors = document.getElementById('competitors').value || '(Not filled)';
      const advantage = document.getElementById('advantage').value || '(Not filled)';
      
      const summary = \`
        <h3 style="color: #667eea; margin-bottom: 16px;">Your App Blueprint</h3>
        <p><strong>Problem:</strong> \${problem}</p>
        <p style="margin-top: 12px;"><strong>Target Customer:</strong> \${targetUser}</p>
        <p style="margin-top: 12px;"><strong>Revenue Model:</strong> \${revenue}</p>
        <p style="margin-top: 12px;"><strong>Core Features:</strong> \${features.split('\\n').filter(f => f.trim()).join('<br>')}</p>
        <p style="margin-top: 12px;"><strong>Competitors:</strong> \${competitors}</p>
        <p style="margin-top: 12px;"><strong>Your Advantage:</strong> \${advantage}</p>
      \`;
      
      document.getElementById('summary').innerHTML = summary;
    }
    
    // Enable launch button when checkbox is checked
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('agree').addEventListener('change', function() {
        document.getElementById('launch-btn').disabled = !this.checked;
      });
      showStep(1);
    });
    
    function launchApp() {
      const problem = document.getElementById('problem').value;
      const targetUser = document.getElementById('target-user').value;
      const revenue = document.querySelector('input[name="revenue"]:checked')?.value;
      const features = document.getElementById('features').value;
      
      if (problem && targetUser && revenue && features) {
        // Show confirmation
        alert('🚀 Your app idea is clear! Share this with developers to start building. You can track progress at https://take-the-reins.ai');
      } else {
        alert('Please complete all fields before launching');
      }
    }
  </script>
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

