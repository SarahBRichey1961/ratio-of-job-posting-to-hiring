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

async function buildAndDeploy(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN
  const GITHUB_USERNAME = process.env.GITHUB_USERNAME

  if (!GITHUB_TOKEN || !NETLIFY_TOKEN || !GITHUB_USERNAME) {
    return res.status(500).json({
      error: 'Missing required environment variables',
    })
  }

  try {
    const { idea, prototype } = req.body as RequestBody

    const repoName = sanitizeRepoName(idea.appName)
    console.log(`🚀 Building: ${idea.mainIdea}`)
    console.log(`📂 Repo: ${repoName}`)

    // 1. CREATE GITHUB REPO
    console.log(`1️⃣ Creating GitHub repository...`)
    const repoData = await createRepo(
      GITHUB_TOKEN,
      repoName,
      idea.mainIdea
    )
    const repoFullName = repoData.full_name
    console.log(`✅ Repo created: ${repoFullName}`)

    // 2. WAIT FOR REPO TO BE READY
    console.log(`⏳ Waiting for repo initialization...`)
    await sleep(2000)

    // 3. GENERATE FILES AND PUSH TO GITHUB
    console.log(`2️⃣ Generating and pushing files to GitHub...`)
    const files = generateFiles(idea, prototype)
    
    for (const file of files) {
      await pushFileToGitHub(
        GITHUB_TOKEN,
        repoFullName,
        file.path,
        file.content
      )
    }
    console.log(`✅ Files pushed (${files.length} files)`)

    // 4. CREATE NETLIFY SITE
    console.log(`3️⃣ Creating Netlify site...`)
    const siteData = await createNetlifySite(
      NETLIFY_TOKEN,
      repoName
    )
    const siteId = siteData.id
    const liveUrl = siteData.url || `https://${siteData.name}.netlify.app`
    console.log(`✅ Site created: ${liveUrl}`)

    // 5. LINK REPO TO NETLIFY
    console.log(`4️⃣ Linking GitHub to Netlify...`)
    await linkRepoToNetlify(
      NETLIFY_TOKEN,
      siteId,
      repoFullName
    )
    console.log(`✅ Linked!`)

    // 6. TRIGGER BUILD
    console.log(`5️⃣ Triggering build...`)
    await triggerBuild(NETLIFY_TOKEN, siteId)

    // 7. WAIT FOR BUILD
    console.log(`⏳ Waiting for build to complete...`)
    const maxWait = 120000 // 2 minutes
    const buildReady = await waitForBuild(NETLIFY_TOKEN, siteId, maxWait)

    if (!buildReady) {
      console.warn(`⚠️ Build taking longer than expected, returning URL anyway`)
    } else {
      console.log(`✅ Build complete!`)
    }

    return res.status(200).json({
      success: true,
      message: 'Your app is live!',
      liveUrl,
      repoUrl: `https://github.com/${repoFullName}`,
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

  if (!res.ok) {
    const error = await res.json()
    if (res.status === 422 && error.message?.includes('already exists')) {
      throw new Error(`Repo name already exists: ${name}`)
    }
    throw new Error(`GitHub error: ${error.message}`)
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
  } catch {}

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
    throw new Error(`Failed to push ${filePath}: ${error.message}`)
  }
}

async function createNetlifySite(
  token: string,
  appName: string
): Promise<any> {
  const name = `${appName}-${Math.random().toString(36).substring(2, 8)}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .substring(0, 63)

  const res = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Netlify error: ${error.message}`)
  }

  return res.json()
}

async function linkRepoToNetlify(
  token: string,
  siteId: string,
  repoFullName: string
): Promise<void> {
  const [owner, repo] = repoFullName.split('/')

  const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo: repoFullName,
        branch: 'main',
      },
      build_settings: {
        cmd: 'npm run build',
        dir: '.next',
      },
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    console.warn(`⚠️ Could not link repo: ${error.message}`)
  }
}

async function triggerBuild(token: string, siteId: string): Promise<void> {
  const res = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/builds`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    console.warn(`⚠️ Could not trigger build`)
  }
}

async function waitForBuild(
  token: string,
  siteId: string,
  maxWait: number
): Promise<boolean> {
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    try {
      const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const site = await res.json()
        if (site.state === 'current') {
          return true
        }
      }
    } catch {}

    await sleep(3000)
  }

  return false
}

function generateAppIndex(idea: RequestBody['idea'], prototype: RequestBody['prototype']): string {
  const features = prototype.buildPlan.slice(0, 2)
    .map((step, i) => {
      const cleaned = step.replace(/^[0-9]+\.\s*/, '')
      const icons = ['🚀', '⚡', '✨', '🎯']
      return `                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <div className="text-4xl mb-3">${icons[i % 4]}</div>
                  <p className="text-slate-400">${cleaned}</p>
                </div>`
    })
    .join('\n')

  return `import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>${idea.appName}</title>
        <meta name="description" content="${idea.mainIdea}" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <header className="border-b border-slate-700 bg-slate-900/80 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              ${idea.appName}
            </h1>
          </div>
        </header>
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-5xl font-bold text-white mb-4">${idea.mainIdea}</h2>
              <p className="text-xl text-slate-300 mb-6">${idea.problemSolved}</p>
              <p className="text-lg text-slate-400 mb-8">${idea.howItWorks}</p>
              <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-8 rounded-lg">
                Get Started
              </button>
            </div>
            <div className="bg-indigo-500/10 border border-slate-700 rounded-lg p-8 h-80 flex items-center justify-center text-slate-300">
              Your App Preview
            </div>
          </div>
          <section className="mb-16">
            <h3 className="text-3xl font-bold text-white mb-8">Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
${features}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}`
}

function generateFiles(
  idea: RequestBody['idea'],
  prototype: RequestBody['prototype']
): Array<{ path: string; content: string }> {
  return [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: idea.appName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          next: '^14.0.0',
        },
        devDependencies: {
          '@types/react': '^18.0.0',
          '@types/node': '^20.0.0',
          typescript: '^5.0.0',
          tailwindcss: '^3.3.0',
          autoprefixer: '^10.4.0',
          postcss: '^8.4.0',
        },
      }, null, 2),
    },
    {
      path: 'next.config.js',
      content: 'module.exports = {}',
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          jsx: 'preserve',
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
        },
      }, null, 2),
    },
    {
      path: 'tailwind.config.js',
      content: 'module.exports = { content: ["./pages/**/*.{js,jsx,ts,tsx}"], theme: {}, plugins: [] }',
    },
    {
      path: 'postcss.config.js',
      content: 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }',
    },
    {
      path: 'pages/index.tsx',
      content: generateAppIndex(idea, prototype),
    },
    {
      path: 'styles/globals.css',
      content: '@tailwind base; @tailwind components; @tailwind utilities;',
    },
    {
      path: 'netlify.toml',
      content: '[build]\ncommand = "npm run build"\npublish = ".next"\n\n[[redirects]]\nfrom = "/*"\nto = "/index.html"\nstatus = 200',
    },
  ]
}

export default buildAndDeploy
