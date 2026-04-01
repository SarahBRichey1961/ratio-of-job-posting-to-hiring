import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  idea: {
    appName: string
    mainIdea: string
    targetUser: string
    problemSolved: string
    howItWorks: string
  }
  prototype: {
    htmlMockup: string
    userFlow: string[]
    feasibility: string
    buildPlan: string[]
    technologies: string[]
    testStrategy: string
    launchStrategy: string
    mvpTasks: string[]
  }
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN as string
const GITHUB_USERNAME = process.env.GITHUB_USERNAME as string

async function buildAndDeploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check for required environment variables
  const missingVars = []
  if (!GITHUB_TOKEN) missingVars.push('GITHUB_TOKEN')
  if (!NETLIFY_TOKEN) missingVars.push('NETLIFY_TOKEN')
  if (!GITHUB_USERNAME) missingVars.push('GITHUB_USERNAME')

  if (missingVars.length > 0) {
    console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`)
    return res.status(500).json({
      error: `Missing required environment variables: ${missingVars.join(', ')}. Please add these to Netlify environment settings.`,
      missing: missingVars,
      instructions: 'Go to Netlify → Site Settings → Build & Deploy → Environment and add: GITHUB_TOKEN, NETLIFY_TOKEN, GITHUB_USERNAME',
    })
  }

  try {
    const { idea, prototype } = req.body as RequestBody

    // Use app name provided by user, sanitize for GitHub
    const repoName = idea.appName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with dash
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .substring(0, 39) // GitHub limit is 39 chars

    if (!repoName || repoName.length === 0) {
      throw new Error('Invalid app name. Please use letters, numbers, dashes, or underscores.')
    }

    console.log(`🚀 Starting build and deploy process for: ${idea.mainIdea}`)
    console.log(`📂 GitHub repo name: ${repoName}`)

    // Step 1: Create GitHub repository
    const createRepoResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        name: repoName,
        description: `${idea.mainIdea}`,
        private: false,
        auto_init: false,
      }),
    })

    if (!createRepoResponse.ok) {
      let error: any = {}
      try {
        error = await createRepoResponse.json()
      } catch (e) {
        console.error(`❌ Failed to parse error response:`, e)
      }

      console.error(`❌ GitHub API Error (${createRepoResponse.status}):`, JSON.stringify(error, null, 2))

      let helpfulMessage = error.message || `HTTP ${createRepoResponse.status}`

      // Provide helpful messages for common errors
      if (error.errors && error.errors.length > 0) {
        const errorDetails = error.errors.map((e: any) => e.message).join(', ')
        helpfulMessage += ` (${errorDetails})`
      }

      // Check for repo already exists (422 Unprocessable Entity)
      if (createRepoResponse.status === 422 && (error.message?.includes('already exists') || error.errors?.some((e: any) => e.message?.includes('already exists')))) {
        console.error(`❌ Repository "${repoName}" already exists on GitHub`)
        return res.status(409).json({
          error: `App name "${repoName}" is already taken on GitHub or Netlify.`,
          code: 'REPO_ALREADY_EXISTS',
          appName: repoName,
        })
      }

      // Handle other specific errors
      if (createRepoResponse.status === 401) {
        helpfulMessage =
          'Invalid GitHub token. Check that GITHUB_TOKEN is set correctly in Netlify environment variables.'
      } else if (createRepoResponse.status === 403) {
        helpfulMessage =
          'GitHub token does not have permission to create repos. Ensure it has "repo" scope.'
      } else if (createRepoResponse.status === 422) {
        // Invalid name
        if (error.message?.includes('name')) {
          helpfulMessage = `Invalid repository name: "${repoName}". Use letters, numbers, dashes, and underscores only.`
        } else {
          helpfulMessage = `Repository creation failed: ${helpfulMessage}`
        }
      }

      console.error(`GitHub repo creation failed with: ${helpfulMessage}`)
      throw new Error(`GitHub repo creation failed: ${helpfulMessage}`)
    }

    const repoData = await createRepoResponse.json()
    const repoUrl = repoData.clone_url
    const repoFullName = repoData.full_name

    console.log(`✅ GitHub repo created: ${repoFullName}`)

    // Step 2: Generate Next.js project files
    const filesToCreate = generateProjectFiles(idea, prototype)

    // Step 3: Create files in GitHub using API
    console.log(`📦 Creating ${filesToCreate.length} files in GitHub repo...`)
    
    // Add a small delay to ensure repo is fully initialized
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    for (const file of filesToCreate) {
      console.log(`  📄 Creating: ${file.path}`)
      await createFileInGitHub(GITHUB_TOKEN, repoFullName, file.path, file.content)
    }
    console.log('✅ All files created successfully')

    // Step 4: Deploy to Netlify and get live URL
    console.log('🌐 Deploying to Netlify...')
    const netlifyUrl = await deployToNetlifyDirect(NETLIFY_TOKEN, repoName, filesToCreate, repoFullName, idea)
    console.log(`✅ Deployment successful! Live at: ${netlifyUrl}`)

    return res.status(200).json({
      success: true,
      liveUrl: netlifyUrl,
      githubRepo: `https://github.com/${repoFullName}`,
      repoName: repoName,
    })
  } catch (error) {
    console.error('❌ Error building and deploying:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    // Provide helpful context for common errors
    let helpfulMessage = message
    if (message.includes('Failed to create') && message.includes('Not Found')) {
      helpfulMessage = `${message}. This usually means your GitHub token doesn't have permission to create files. Make sure you've created a Personal Access Token with 'repo' scope at https://github.com/settings/tokens`
    }
    
    return res.status(500).json({ error: `Failed to build and deploy: ${helpfulMessage}` })
  }
}

function generateProjectFiles(
  idea: RequestBody['idea'],
  prototype: RequestBody['prototype']
): Array<{ path: string; content: string }> {
  const buildPlanMD = `# ${idea.mainIdea}

## Target User
${idea.targetUser}

## Problem Solved
${idea.problemSolved}

## How It Works
${idea.howItWorks}

## Build Plan
${prototype.buildPlan.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## MVP Tasks
${prototype.mvpTasks.map((task) => `- [ ] ${task}`).join('\n')}

## Testing Strategy
${prototype.testStrategy}

## Launch Strategy
${prototype.launchStrategy}

## Recommended Tech Stack
${prototype.technologies.map((tech) => `- ${tech}`).join('\n')}
`

  const packageJson = {
    name: 'idea-builder-app',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      next: '^14.0.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.0.0',
      '@types/react-dom': '^18.0.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.3.0',
      eslint: '^8.0.0',
      'eslint-config-next': '^14.0.0',
    },
  }

  const tsconfigJson = {
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      jsx: 'preserve',
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false,
      forceConsistentCasingInFileNames: true,
      baseUrl: '.',
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }

  const nextConfigJs = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`

  const tailwindConfigJs = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`

  const postcssConfigJs = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`

  const indexPageTsx = `import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Your App - Build the Damn Thing!</title>
        <meta name="description" content="Your app built with AI" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">🎉 Your App is Live!</h1>
            <p className="text-xl text-slate-400">
              Welcome to your freshly built app on Netlify
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">🚀 Next Steps</h2>
              <ol className="text-slate-300 space-y-3 list-decimal list-inside">
                <li>Customize this page to match your vision</li>
                <li>Test with real users</li>
                <li>Deploy updates (git push auto-deploys!)</li>
                <li>Gather feedback and iterate</li>
              </ol>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">📚 Resources</h2>
              <ul className="text-slate-300 space-y-3 list-disc list-inside">
                <li>
                  <a href="https://nextjs.org/docs" className="text-indigo-400 hover:text-indigo-300">
                    Next.js Documentation
                  </a>
                </li>
                <li>
                  <a href="https://tailwindcss.com/docs" className="text-indigo-400 hover:text-indigo-300">
                    Tailwind CSS
                  </a>
                </li>
                <li>
                  <a href="https://github.com" className="text-indigo-400 hover:text-indigo-300">
                    Your GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-blue-900/30 border border-blue-700/50 rounded-lg p-8 text-center">
            <p className="text-blue-200 text-lg font-semibold">
              💡 Remember: Ship fast, iterate based on user feedback. Your users will teach you what matters.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
`

  const netlifyToml = `[build]
  command = "npm run build"
  publish = ".next"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`

  const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
.next/
out/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
`

  return [
    { path: 'README.md', content: buildPlanMD },
    { path: 'package.json', content: JSON.stringify(packageJson, null, 2) },
    { path: 'tsconfig.json', content: JSON.stringify(tsconfigJson, null, 2) },
    { path: 'next.config.js', content: nextConfigJs },
    { path: 'tailwind.config.js', content: tailwindConfigJs },
    { path: 'postcss.config.js', content: postcssConfigJs },
    { path: '.gitignore', content: gitignore },
    { path: 'netlify.toml', content: netlifyToml },
    { path: 'styles/globals.css', content: globalsCss },
    { path: 'pages/index.tsx', content: indexPageTsx },
  ]
}

async function createFileInGitHub(
  token: string,
  repoFullName: string,
  filePath: string,
  content: string
): Promise<void> {
  const url = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`
  const encodedContent = Buffer.from(content).toString('base64')

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'BuildTheDamnThing',
    },
    body: JSON.stringify({
      message: `Add ${filePath}`,
      content: encodedContent,
      branch: 'main',
    }),
  })

  if (!response.ok) {
    let errorDetails = ''
    try {
      const error = await response.json()
      errorDetails = error.message || error.error || JSON.stringify(error)
    } catch {
      errorDetails = `HTTP ${response.status} ${response.statusText}`
    }

    console.error(`    ❌ Failed to create ${filePath}:`, errorDetails)
    
    if (response.status === 404) {
      throw new Error(`Repository ${repoFullName} not found. Check your GitHub token has repo access and the repo was created successfully.`)
    }
    throw new Error(`Failed to create ${filePath}: ${errorDetails}`)
  }

  console.log(`    ✅ File created: ${filePath}`)
}

async function deployToNetlifyDirect(
  token: string,
  appName: string,
  files: Array<{ path: string; content: string }>,
  repoFullName: string,
  idea: RequestBody['idea']
): Promise<string> {
  // Create a simple Netlify site (no GitHub connection - just deploy files)
  // Add random suffix to make subdomain unique on Netlify
  const randomSuffix = Math.random().toString(36).substring(2, 8) // e.g., "a3k9z2"
  const netlifyName = `${appName}-${randomSuffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 63)
  
  console.log(`📍 Creating Netlify site with name: ${netlifyName}...`)
  console.log(`📍 Using token: ${token ? `${token.substring(0, 10)}...` : 'NOT SET'}`)
  
  const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: netlifyName,
    }),
  })

  console.log(`📍 Netlify response status: ${createSiteResponse.status}`)

  if (!createSiteResponse.ok) {
    let errorInfo = ''
    try {
      const errorJson = await createSiteResponse.json()
      errorInfo = JSON.stringify(errorJson, null, 2)
    } catch (e) {
      const errorText = await createSiteResponse.text()
      errorInfo = errorText
    }
    console.error('❌ Netlify site creation error:', errorInfo)
    throw new Error(`Netlify site creation failed (${createSiteResponse.status}): ${errorInfo}`)
  }

  const siteData = await createSiteResponse.json()
  const siteName = siteData.name
  const siteId = siteData.id
  const liveUrl = siteData.url || siteData.ssl_url || `https://${siteName}.netlify.app`
  
  console.log(`✅ Netlify site created: ${siteName}`)
  console.log(`   Site ID: ${siteId}`)
  console.log(`   Live URL: ${liveUrl}`)
  
  // Disable GitHub connection to prevent Netlify from trying to build from repo
  console.log(`🔒 Disabling repository connection...`)
  try {
    await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo: null,
      }),
    })
    console.log(`✅ Repository connection disabled`)
  } catch (err) {
    console.warn(`⚠️  Could not disable repo connection: ${(err as Error).message}`)
  }
  
  // Create landing page HTML
  const landingPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${idea.mainIdea} - Built with AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { font-size: 32px; margin-bottom: 16px; color: #333; }
    p { font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 16px; }
    .highlight { color: #667eea; font-weight: 600; }
    .box {
      background: #f7f7f7;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .box h2 { font-size: 18px; margin-bottom: 10px; color: #333; }
    .box strong { color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 <span class="highlight">${idea.mainIdea}</span></h1>
    <p>Your idea has been created and is ready to go live!</p>
    
    <div class="box">
      <h2>📋 Your Idea</h2>
      <p><strong>For:</strong> ${idea.targetUser}</p>
      <p><strong>Solves:</strong> ${idea.problemSolved}</p>
      <p><strong>How:</strong> ${idea.howItWorks}</p>
    </div>
    
    <div class="box">
      <h2>🚀 Next Steps</h2>
      <p>1. <strong>Test your idea</strong> - Try it and notice what works</p>
      <p>2. <strong>Share with 5-10 people</strong> - Ask: "Does this solve your problem?"</p>
      <p>3. <strong>Listen to feedback</strong> - Write down what they say</p>
      <p>4. <strong>Iterate and improve</strong> - Make it better based on feedback</p>
    </div>
    
    <p style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
      ✨ Ship fast, iterate, learn from users. Success comes from action.
    </p>
  </div>
</body>
</html>`

  // Deploy HTML to Netlify
  // Deploy HTML to Netlify by uploading the file directly
  console.log(`📤 Uploading landing page to Netlify...`)
  try {
    // Upload index.html directly to Netlify
    const fileUploadResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/files/index.html`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: landingPageHTML,
    })

    console.log(`📍 File upload response status: ${fileUploadResponse.status}`)
    
    if (fileUploadResponse.ok) {
      console.log(`✅ Landing page uploaded successfully!`)
      console.log(`✅ View your site: ${liveUrl}`)
    } else {
      let errorDetails = ''
      try {
        const errorJson = await fileUploadResponse.json()
        errorDetails = JSON.stringify(errorJson, null, 2)
      } catch (e) {
        const errorText = await fileUploadResponse.text()
        errorDetails = errorText.substring(0, 500)
      }
      console.warn(`⚠️  File upload failed (${fileUploadResponse.status}):`, errorDetails)
    }
  } catch (err) {
    console.warn(`⚠️  Error uploading file: ${(err as Error).message}`)
  }

  console.log(`✅ Your site is live at: ${liveUrl}`)
  console.log(`📦 Your code repo: https://github.com/${repoFullName}`)
  return liveUrl
}

export default buildAndDeploy
