import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface BlueprintData {
  background: string
  skills: string
  interests: string
  manifesto: string
  resume: string
  chosenIdea: string
  problem: string
  targetUser: string
  revenue: string
  features: string
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

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export default async function deployBlueprint(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN

  if (!NETLIFY_TOKEN) {
    console.error(`❌ NETLIFY_TOKEN missing`)
    return res.status(500).json({
      error: 'Netlify token not configured. Admin must check environment variables.',
    })
  }

  try {
    const blueprint: BlueprintData = req.body

    if (!blueprint.chosenIdea || !blueprint.problem || !blueprint.targetUser) {
      return res.status(400).json({
        error: 'Missing required blueprint fields',
      })
    }

    console.log(`\n🚀 DEPLOYING FROM BLUEPRINT: ${blueprint.chosenIdea}`)

    // Generate app code based on the blueprint
    const files = generateAppFromBlueprint(blueprint)
    console.log(`✅ Generated ${files.length} files`)

    // Deploy to Netlify
    console.log(`\n📦 Deploying to Netlify...`)
    const liveUrl = await deployToNetlifyDirect(NETLIFY_TOKEN, blueprint.chosenIdea, files)
    console.log(`✅ Live at: ${liveUrl}`)

    return res.status(200).json({
      success: true,
      liveUrl: liveUrl,
      appName: blueprint.chosenIdea,
      status: 'deployed',
      message: 'Your app has been generated and deployed!',
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : ''
    console.error(`\n❌ DEPLOYMENT FAILED: ${msg}`)
    if (stack) console.error(`   Stack: ${stack.split('\n').slice(0, 3).join('\n   ')}`)
    return res.status(500).json({ error: msg })
  }
}

/**
 * Generate an app customized to their blueprint
 */
function generateAppFromBlueprint(blueprint: BlueprintData): Array<{ path: string; content: string }> {
  const appTitle = blueprint.chosenIdea
  const problemStatement = blueprint.problem
  const targetCustomer = blueprint.targetUser
  const revenueModel = blueprint.revenue
  const features = blueprint.features.split('\n').filter(f => f.trim())

  // Create a custom landing page + app demo based on their blueprint
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      min-height: 100vh; 
      padding: 20px;
    }
    .container { 
      max-width: 1000px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
      overflow: hidden;
    }
    .hero { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 60px 40px;
      text-align: center;
    }
    .hero h1 { 
      font-size: 3em; 
      margin-bottom: 16px; 
      font-weight: 700;
    }
    .hero p { 
      font-size: 1.3em; 
      opacity: 0.95; 
      margin-bottom: 8px;
    }
    .hero .tagline { 
      font-size: 0.95em; 
      opacity: 0.85;
    }
    .content { padding: 60px 40px; }
    .section { margin-bottom: 40px; }
    .section h2 { 
      color: #333; 
      font-size: 1.8em; 
      margin-bottom: 16px; 
      border-bottom: 3px solid #667eea; 
      padding-bottom: 12px;
    }
    .section p { 
      color: #666; 
      line-height: 1.8; 
      margin-bottom: 12px;
      font-size: 1.1em;
    }
    .features { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-top: 24px;
    }
    .feature { 
      background: #f8f9fa; 
      padding: 20px; 
      border-radius: 12px; 
      border-left: 4px solid #667eea;
    }
    .feature h3 { 
      color: #667eea; 
      margin-bottom: 8px;
    }
    .feature p { 
      color: #666; 
      margin: 0;
    }
    .demo { 
      background: #f8f9fa; 
      padding: 40px; 
      border-radius: 12px; 
      text-align: center;
      margin-top: 40px;
    }
    .demo h3 { color: #333; margin-bottom: 24px; }
    .demo-button { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      border: none; 
      padding: 16px 40px; 
      font-size: 1.1em; 
      border-radius: 8px; 
      cursor: pointer;
      transition: all 0.3s;
    }
    .demo-button:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }
    .stats { 
      display: grid; 
      grid-template-columns: 1fr 1fr 1fr; 
      gap: 20px; 
      margin-top: 24px;
    }
    .stat { 
      text-align: center; 
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    .stat-number { 
      font-size: 2em; 
      color: #667eea; 
      font-weight: 700;
    }
    .stat-label { 
      color: #666; 
      font-size: 0.9em; 
      margin-top: 8px;
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px 40px; 
      text-align: center; 
      color: #666; 
      border-top: 1px solid #e0e0e0;
    }
    @media (max-width: 768px) { 
      .hero h1 { font-size: 2em; }
      .features { grid-template-columns: 1fr; }
      .stats { grid-template-columns: 1fr; }
      .content { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>${appTitle}</h1>
      <p>${problemStatement}</p>
      <p class="tagline">Built for ${targetCustomer}</p>
    </div>

    <div class="content">
      <div class="section">
        <h2>The Problem</h2>
        <p>${problemStatement}</p>
        <p>Many people struggle with this daily. Your solution is here to make it simpler.</p>
      </div>

      <div class="section">
        <h2>Who This Is For</h2>
        <p><strong>Target Customer:</strong> ${targetCustomer}</p>
        <p>We built this specifically for people who need a better solution to their challenges.</p>
      </div>

      <div class="section">
        <h2>Key Features</h2>
        <div class="features">
          ${features.slice(0, 6).map(feature => 
            \`<div class="feature">
              <h3>✨ \${feature.trim()}</h3>
              <p>Designed to make your workflow smoother and more efficient.</p>
            </div>\`
          ).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Pricing</h2>
        <p><strong>Revenue Model:</strong> \${revenueModel}</p>
        <p>We believe in fair pricing that reflects the value you get. Get started today and experience the difference.</p>
      </div>

      <div class="demo">
        <h3>Ready to Transform Your Workflow?</h3>
        <p style="color: #666; margin-bottom: 24px;">This app is live and ready to help you solve your biggest challenges.</p>
        <button class="demo-button" onclick="showStats()">See It In Action</button>
        <div id="stats-container" style="display: none; margin-top: 24px;"></div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-number">100%</div>
          <div class="stat-label">Built for Your Needs</div>
        </div>
        <div class="stat">
          <div class="stat-number">∞</div>
          <div class="stat-label">Possibilities</div>
        </div>
        <div class="stat">
          <div class="stat-number">🚀</div>
          <div class="stat-label">Launch Ready</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Your app is live and ready. Built from your vision on \${new Date().toLocaleDateString()}.</p>
      <p style="margin-top: 12px; font-size: 0.9em;">Next step: Share this with your customers and start earning income.</p>
    </div>
  </div>

  <script>
    function showStats() {
      const container = document.getElementById('stats-container');
      container.style.display = 'block';
      container.innerHTML = \`
        <h4 style="color: #333; margin-bottom: 12px;">Impact Metrics</h4>
        <p style="color: #666;">Users who implement this solution report:</p>
        <ul style="color: #666; margin-top: 12px; margin-left: 20px; line-height: 1.8;">
          <li>40% increase in efficiency</li>
          <li>Reduced manual work by 60%</li>
          <li>Better decision-making with data</li>
          <li>Team collaboration improvement</li>
        </ul>
      \`;
    }
  </script>
</body>
</html>`

  return [{ path: 'index.html', content: html }]
}

/**
 * Deploy directly to Netlify
 */
async function deployToNetlifyDirect(
  netlifyToken: string,
  appName: string,
  files: Array<{ path: string; content: string }>
): Promise<string> {
  const siteName = sanitizeSiteName(appName)

  // Create Netlify site
  console.log(`📍 Creating Netlify site: ${siteName}`)
  const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: siteName }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '')
    try {
      const err = JSON.parse(errText)
      throw new Error(`Netlify API error: ${err.message || JSON.stringify(err)}`)
    } catch {
      throw new Error(`Netlify site creation failed: ${createRes.status} ${createRes.statusText} - ${errText}`)
    }
  }

  const siteData = await createRes.json()
  const siteId = siteData.id
  const siteUrl = siteData.ssl_url || siteData.url || `https://${siteName}.netlify.app`
  console.log(`✅ Site created: ${siteUrl}`)

  // Prepare files with SHA hashes
  const fileHashes: Record<string, string> = {}
  files.forEach(file => {
    const hash = crypto.createHash('sha1').update(file.content).digest('hex')
    fileHashes[`/${file.path}`] = hash
  })

  // Create deploy
  console.log(`📤 Creating deploy...`)
  const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: fileHashes }),
  })

  if (!deployRes.ok) {
    const errText = await deployRes.text().catch(() => '')
    throw new Error(`Deploy creation failed: ${deployRes.status} - ${errText}`)
  }

  const deployData = await deployRes.json()
  const deployId = deployData.id

  // Upload files
  console.log(`📮 Uploading files...`)
  for (const file of files) {
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}/files/${encodeURIComponent('/' + file.path)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': getMimeType(file.path),
        },
        body: file.content,
      }
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => '')
      throw new Error(`File upload failed for ${file.path}: ${uploadRes.status} - ${errText}`)
    }

    console.log(`✅ Uploaded: ${file.path}`)
  }

  return siteUrl
}

/**
 * Sanitize site name for Netlify
 */
function sanitizeSiteName(appName: string): string {
  let sanitized = appName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40)

  const uniqueSuffix = '-' + Date.now().toString(36)
  sanitized = sanitized + uniqueSuffix

  if (sanitized.length > 63) {
    sanitized = sanitized.substring(0, 63)
  }

  return sanitized
}
