import { NextApiRequest, NextApiResponse } from 'next'

interface RequestBody {
  idea: {
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

    // Generate repo name from idea
    const repoName = `app-${idea.mainIdea.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}`
    const timestamp = Date.now()
    const uniqueRepoName = `${repoName}-${timestamp}`

    // Step 1: Create GitHub repository
    const createRepoResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: uniqueRepoName,
        description: `${idea.mainIdea}`,
        private: false,
        auto_init: true,
      }),
    })

    if (!createRepoResponse.ok) {
      const error = await createRepoResponse.json()
      throw new Error(`GitHub repo creation failed: ${error.message}`)
    }

    const repoData = await createRepoResponse.json()
    const repoUrl = repoData.clone_url
    const repoFullName = repoData.full_name

    // Step 2: Generate Next.js project files
    const filesToCreate = generateProjectFiles(idea, prototype)

    // Step 3: Create files in GitHub using API
    for (const file of filesToCreate) {
      await createFileInGitHub(GITHUB_TOKEN, repoFullName, file.path, file.content)
    }

    // Step 4: Deploy to Netlify and get live URL
    const netlifyUrl = await deployToNetlify(NETLIFY_TOKEN, repoFullName, idea)

    return res.status(200).json({
      success: true,
      liveUrl: netlifyUrl,
      githubRepo: `https://github.com/${repoFullName}`,
      repoName: uniqueRepoName,
    })
  } catch (error) {
    console.error('Error building and deploying:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ error: `Failed to build and deploy: ${message}` })
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
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add ${filePath}`,
        content: Buffer.from(content).toString('base64'),
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create ${filePath}: ${error.message}`)
  }
}

async function deployToNetlify(
  token: string,
  repoFullName: string,
  idea: RequestBody['idea']
): Promise<string> {
  // Create Netlify site
  const createSiteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `app-${Date.now()}`,
      repo: {
        provider: 'github',
        repo: repoFullName,
        branch: 'main',
        deploy_key_id: '',
      },
    }),
  })

  if (!createSiteResponse.ok) {
    const error = await createSiteResponse.json()
    console.error('Netlify site creation error:', error)
    throw new Error(`Netlify deployment failed: ${error.message || 'Unknown error'}`)
  }

  const siteData = await createSiteResponse.json()
  const liveUrl = siteData.url || siteData.ssl_url || `https://${siteData.name}.netlify.app`

  return liveUrl
}

export default buildAndDeploy
