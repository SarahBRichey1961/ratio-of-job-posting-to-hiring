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

    // STEP 1: Generate custom app using OpenAI
    console.log(`\n1️⃣ Generating custom app with OpenAI...`)
    let customHtml = ''
    
    if (OPENAI_API_KEY) {
      try {
        const gptResponse = await generateCustomAppWithOpenAI(
          appName,
          appIdea,
          targetUser,
          problemSolved,
          howItWorks,
          OPENAI_API_KEY,
          req_body.questions,
          req_body.answers
        )
        customHtml = gptResponse
        console.log(`   ✅ Custom app generated (${customHtml.length} bytes)`)
      } catch (gptErr) {
        console.warn(`   ⚠️ OpenAI generation failed, falling back to template:`, gptErr instanceof Error ? gptErr.message : String(gptErr))
        customHtml = ''
      }
    } else {
      console.warn(`   ⚠️ OPENAI_API_KEY not set, using template`)
    }

    // STEP 2: Generate files for deployment
    console.log(`\n2️⃣ Preparing deployment files...`)
    const files = customHtml 
      ? [{ path: 'index.html', content: customHtml }]
      : generateReactViteApp(appName, appIdea, targetUser, problemSolved, howItWorks)
    console.log(`   ✅ Generated ${files.length} files`)

    // STEP 3: Deploy to Netlify
    console.log(`\n3️⃣ Deploying to Netlify...`)
    let liveUrl: string
    try {
      liveUrl = await deployToNetlifyDirect(NETLIFY_TOKEN, appName, files)
      console.log(`   ✅ Deployed: ${liveUrl}`)
    } catch (deployErr) {
      const deployMsg = deployErr instanceof Error ? deployErr.message : String(deployErr)
      console.error(`\n❌ DEPLOYMENT FAILED: ${deployMsg}`)
      throw new Error(`Failed to deploy app to Netlify: ${deployMsg}`)
    }

    console.log(`\n✨ APP BUILT AND DEPLOYED: ${appName}\n`)

    return res.status(200).json({
      success: true,
      message: 'Your app has been built and deployed to Netlify!',
      appName: appName,
      liveUrl: liveUrl,
      status: 'deployed',
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
 * Generate custom app HTML using OpenAI GPT-4o
 */
async function generateCustomAppWithOpenAI(
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
    qaContext = '\n\nUSER\'S SPECIFIC ANSWERS (use these to customize the app):\n'
    questions.forEach((q, i) => {
      qaContext += `Q: ${q}\nA: ${answers?.[i] || 'Not answered'}\n\n`
    })
  }

  const prompt = `You are an expert web developer. Generate a FULLY FUNCTIONAL, PRODUCTION-READY web app.

THIS IS THE ACTUAL APP TO BUILD - NOT A FORM OR TEMPLATE:

App Name: ${appName}
Main Idea: ${appIdea}
Target User: ${targetUser}
Problem It Solves: ${problemSolved}
How It Works: ${howItWorks}
${qaContext}

IDENTIFY ALL FEATURES:
Analyze the app idea AND USER ANSWERS to identify ALL distinct features/sections/pages:
- Check the answers for mentions of "write", "create", "compose", "letter", "poem" → include composition
- Check the answers for mentions of "search", "find", "browse", "discover", "read", "view" → include discovery/search
- If it's a "write AND view" app → include BOTH composition AND browsing sections
- If it's a "create AND search" app → include BOTH creation AND search/discovery sections
- If it mentions multiple actions → implement ALL of them
- DO NOT OMIT ANY PART of the idea - if the user described something, build it
- For grandparent apps: ALWAYS check if answers mention search/discovery and include that feature

NAVIGATION STRUCTURE:
- Create clear tabs, buttons, or sections to switch between features
- Start with the FIRST/MAIN feature visible by default
- Make all features easily accessible from navigation
- Use buttons/links to switch between sections

SPECIAL HANDLING FOR GRANDPARENT APPS:
If the app idea mentions "grandparent", "letter", "poem", "correspondence", "search", or "find":
BUILD BOTH FEATURES if mentioned in answers:

FEATURE 1: WRITE/CREATE LETTERS/POEMS (if mentioned in answers):
1. FIRST SCREEN: Collect user information
   - Input field: "Your Name (Grandparent's name)" - text input
   - Input field: "Your Location" - text input (city, state or just city)
   - Button: "Continue" - saves info to sessionStorage (temporary)
   
2. SECOND SCREEN: Composition (Letter or Poem - match the answer)
   - Show the saved name and location at top (e.g., "Letter from [Name] in [Location]")
   - Textarea: "Your message to your grandchild" - large text area for typing
   - Check answers: if mentions "poem" → ask for poem topic; if mentions "letter" → ask for letter content
   - Button: "Transform into [Letter/Poem]" - calls the rewrite API with the user's info
   - Show loading state: "Transforming your message..."
   
3. DISPLAY REWRITTEN RESULT
   - Prominently display the AI-generated letter/poem
   - Include the personalization: "From your loving [Grandpa/Grandma] [Name] in [Location]"
   - Button: "Copy" - copy to clipboard
   - Button: "Save" - SAVES TO DATABASE via API call to /api/hub/app-submission-save
   
4. VIEW SAVED LETTERS/POEMS
   - Tab or section showing all previously saved items
   - Call /api/hub/app-submission-search?appName=[APP_NAME]&name=[optional]&location=[optional]
   - Display each with date created and a preview
   - Click to view full text via /api/hub/app-submission/[id]

FEATURE 2: SEARCH/BROWSE/DISCOVER LETTERS/POEMS (if mentioned in answers):
If answers mention "search", "find", "browse", "discover", or "grandkids read letters":
1. SEARCH INTERFACE
   - Input field: "Search by grandparent name" - search by name
   - Input field: "Search by location" - search by city/state
   - Dropdown or filter: "Type" - Filter by Letter, Poem, or All
   - Button: "Search" - calls /api/hub/app-submission-search?appName=[APP_NAME]&name=[name]&location=[location]&type=[type]
   
2. BROWSE ALL / SEARCH RESULTS
   - Displays results from database API call
   - Each item shows: Grandparent Name, Location, Type (Letter/Poem), Date, Preview (first 100 chars)
   - Click to expand and load full text via /api/hub/app-submission/[id]
   - Show "No results found" if search returns nothing
   
3. VIEW FULL LETTER/POEM
   - Display complete text fetched from database
   - Show sender info: "From [Name] in [Location]"
   - Show type: "Letter" or "Poem"
   - Button: "Copy Full Text" - copy to clipboard
   - Button: "Share" - share via link or social
   - Button: "Back to Results" - return to search/browse

BOTH FEATURES MUST HAVE NAVIGATION:
- Create TAB NAVIGATION or BUTTON NAVIGATION at the top
- Tab 1: "Write [Letter/Poem]" - composition feature
- Tab 2: "Search & Read" or "Browse Letters" - search/discovery feature
- User can switch between tabs easily

AI TEXT REWRITING API (MUST BE USED):
If the app needs to transform/rewrite user input using AI, ALWAYS use this backend API:
- URL: https://take-the-reins.ai/api/hub/rewrite-with-ai
- Method: POST
- Headers: { "Content-Type": "application/json" }
- Body: { "text": "user input to rewrite", "appName": "${appName}", "appIdea": "${appIdea}", "rewriteStyle": "letter" }
- Response: { "success": true, "original": "...", "rewritten": "..." }
- For grandparent letters: ALWAYS use rewriteStyle: "letter"

SAVE/SEARCH DATABASE API (MUST BE USED FOR PERSISTENCE):
For apps that save or search, use these EXACT APIs with FULL URLS (NOT relative paths):

1. SAVE TO DATABASE:
```javascript
const response = await fetch('https://take-the-reins.ai/api/hub/app-submission-save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appName: '${appName}',
    appIdea: '${appIdea}',
    name: senderName,      // user's name
    location: senderLocation,  // user's location (optional)
    submissionType: 'letter',  // 'letter', 'poem', 'message', etc.
    content: letterContent  // the full text to save
  })
});
const data = await response.json();
if (data.success) {
  console.log('Saved! ID:', data.id);
} else {
  console.error('Save failed:', data.error);
}
```

2. SEARCH DATABASE:
```javascript
const nameParam = encodeURIComponent(searchName || '');
const locationParam = encodeURIComponent(searchLocation || '');
const response = await fetch(`https://take-the-reins.ai/api/hub/app-submission-search?appName=${appName}&name=\${nameParam}&location=\${locationParam}&type=letter`);
const data = await response.json();
if (data.success) {
  // data.results is array of {id, name, location, submissionType, preview, createdAt}
  results.forEach(item => console.log(item));
}
```

3. GET FULL SUBMISSION:
```javascript
const response = await fetch(`https://take-the-reins.ai/api/hub/app-submission/\${submissionId}`);
const data = await response.json();
if (data.success) {
  console.log('Full content:', data.submission.content);
}
```

CRITICAL REQUIREMENT:
- ALWAYS use FULL URLS starting with https://take-the-reins.ai/api/hub/ 
- NEVER use relative paths like /api/hub/
- URLs in JavaScript must use backticks and ${} for string interpolation

JAVASCRIPT CODE EXAMPLE for calling the rewrite API:
\`\`\`javascript
async function rewriteWithAI(text, senderName, senderLocation) {
  try {
    const response = await fetch('https://take-the-reins.ai/api/hub/rewrite-with-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        appName: "${appName}",
        appIdea: "${appIdea}",
        rewriteStyle: "letter",
        senderName: senderName,        // For grandparent apps: the grandparent's name
        senderLocation: senderLocation // For grandparent apps: the grandparent's location
      })
    });
    
    if (!response.ok) {
      throw new Error('API error: ' + response.status);
    }
    
    const data = await response.json();
    if (data.success) {
      return data.rewritten;  // Use this as the output - the AI-transformed letter
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Rewrite failed:', error);
    alert('Failed to transform message: ' + error.message);
    return null;
  }
}
\`\`\`

REQUIREMENTS FOR AI REWRITING:
1. ALWAYS show a loading spinner while waiting for the API response
2. MUST display the rewritten result prominently in the UI
3. Include error handling - show user if rewrite fails
4. Store the result so user can see it or copy it
5. For grandparent apps: pass senderName and senderLocation to personalize the letter
6. Display both original and rewritten side-by-side if possible
7. Make the "Transform/Rewrite" button functional and obvious
8. Add "Copy" button so user can copy the generated letter
9. Add "Save" button to save letter to DATABASE via /api/hub/app-submission-save

CRITICAL REQUIREMENTS:
1. Generate a COMPLETE, WORKING single-file HTML+CSS+JavaScript app
2. The app MUST BE FUNCTIONAL - users should be able to USE it immediately
3. MUST be SPECIFIC to the above idea - NOT generic, NOT a form asking for input
4. Generate ALL FEATURES mentioned in the idea AND ANSWERS - nothing should be missing
5. If answers mention "search" or "find" → MUST include search/discovery feature using DATABASE API
6. If answers mention "letter" or "poem" → MUST include composition feature with SAVE TO DATABASE
7. If answers mention BOTH → MUST include BOTH with tab navigation or menu switching
8. Include navigation to switch between all feature sections
9. Make it interactive and polished
10. CRITICAL: Use ONLY inline CSS - NO external stylesheets or CDN resources
    - DO NOT load Tailwind CSS from CDN (causes tracking prevention errors)
    - DO NOT link to external fonts or resources
    - Include ALL CSS directly in <style> tags in the <head>
    - Create a professional UI with pure CSS (flexbox, grid, etc.) - no framework needed
11. Include all CSS and JavaScript inline - no external files or CDN resources
12. Make the UI professional and modern using pure CSS only
13. CRITICAL: Include a favicon in the <head> section - use a data URI to avoid 404 errors:
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>">
14. CRITICAL: ALL localStorage/sessionStorage access MUST be wrapped in try-catch blocks to handle tracking prevention:
    Example: 
    try {
      localStorage.setItem('key', 'value');
    } catch (e) {
      console.warn('Storage unavailable (tracking prevention)');
      // Use alternative storage like in-memory variables
    }
15. If the app transforms/rewrites text with AI, MUST integrate the API call above
16. Show loading spinner with "Transforming..." message while waiting for API response
17. Display the rewritten text prominently after API returns
18. Include error handling if the API call fails (show error message to user)
19. For save/search features: Use these DATABASE API endpoints (NOT localStorage):
    - SAVE: POST https://take-the-reins.ai/api/hub/app-submission-save with body { appName, appIdea, name, location, submissionType, content }
    - SEARCH: GET https://take-the-reins.ai/api/hub/app-submission-search?appName=[APP_NAME]&name=[optional]&location=[optional]&type=[optional]
    - GET DETAIL: GET https://take-the-reins.ai/api/hub/app-submission/[id]
20. For grandparent apps: Check if answers mention search/discovery and ALWAYS include that feature

STYLING AND COLORS - CRITICAL:
LOOK for styling answers in the USER ANSWERS section above. Find the answer that mentions "background color", "font color", or "text alignment".
Extract those preferences and use them EXACTLY in your CSS:
- If answer mentions specific colors (e.g., "dark blue background, white text") → use those EXACT colors
- If answer mentions alignment (e.g., "center aligned", "left-aligned") → apply text-align to all content accordingly
- If answer mentions a color scheme or theme → implement it throughout the UI
- Create a color scheme based on these preferences and apply it to all backgrounds, text, buttons, and borders
If styling answer is vague or not provided, use a professional dark theme with good contrast.

API ENDPOINTS - CRITICAL:
When calling backend APIs, MUST use FULL URLs starting with https://take-the-reins.ai/api/hub/
NOT relative paths like /api/hub/
- FULL URL for save: https://take-the-reins.ai/api/hub/app-submission-save
- FULL URL for search: https://take-the-reins.ai/api/hub/app-submission-search
- FULL URL for get detail: https://take-the-reins.ai/api/hub/app-submission
Example JavaScript:
```javascript
const response = await fetch('https://take-the-reins.ai/api/hub/app-submission-save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ appName: '${appName}', ... })
});
```

IMPORTANT: This is the ACTUAL COMPLETE APP, not a demo or template. Users should be able to use EVERY FEATURE right away without switching apps or reloading.

FINAL VALIDATION CHECKLIST:
Before you output the HTML, verify that your app includes:
- [ ] All features mentioned in the APP IDEA - check all mentions of features
- [ ] All features mentioned in USER ANSWERS - check if answers mention "search", "write", "compose", "read", etc.
- [ ] If a grandparent app mentions both writing AND searching: both features are present with clear navigation
- [ ] Tab navigation or button navigation to switch between features (if multiple features)
- [ ] Styling applied based on user's color/alignment preferences from the answers
- [ ] localStorage implementation for persistence (with try-catch blocks)
- [ ] API calls use FULL URLS to https://take-the-reins.ai/api/hub/ not relative paths
- [ ] API integration if the app needs to rewrite/transform text
- [ ] Error handling and loading states
- [ ] Professional, polished UI
- [ ] NO placeholder text asking users for input - the app should function as described, not as a form

If any feature from the idea or answers is missing from your HTML, ADD IT before returning.

RETURN ONLY: Complete HTML starting with <!DOCTYPE html>. No markdown. No code blocks. Just HTML.`

  console.log(`   📤 Sending to OpenAI...`)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`   ❌ OpenAI API error (${response.status}):`, error)
    throw new Error(`OpenAI API failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  const htmlContent = data.choices?.[0]?.message?.content

  if (!htmlContent) {
    console.error(`   ❌ No content in OpenAI response:`, data)
    throw new Error('Empty response from OpenAI')
  }

  if (!htmlContent.includes('<!DOCTYPE')) {
    console.error(`   ❌ Invalid HTML response (no DOCTYPE found). Content preview:`, htmlContent.substring(0, 200))
    throw new Error('Invalid HTML response from OpenAI (missing DOCTYPE)')
  }

  console.log(`   ✅ OpenAI generated ${htmlContent.length} bytes of HTML`)
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
 * This is a professional landing/demo page for their app idea - NOT a form asking for input
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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #ffffff;
      min-height: 100vh;
    }
    .container { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem; }
    .text-center { text-align: center; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-12 { margin-bottom: 3rem; }
    .mt-12 { margin-top: 3rem; }
    .inline-block { display: inline-block; }
    .grid { display: grid; }
    .gap-4 { gap: 1rem; }
    .gap-8 { gap: 2rem; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 768px) {
      .grid-cols-2, .grid-cols-3 { grid-template-columns: 1fr; }
    }
    h1 { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; }
    h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #60a5fa; }
    p { line-height: 1.6; }
    .text-xl { font-size: 1.25rem; }
    .text-lg { font-size: 1.125rem; }
    .text-2xl { font-size: 1.5rem; }
    .text-sm { font-size: 0.875rem; }
    .text-slate-300 { color: #cbd5e1; }
    .text-blue-400 { color: #60a5fa; }
    .text-green-400 { color: #4ade80; }
    .text-slate-400 { color: #94a3b8; }
    .bg-slate-800-50 { background-color: rgba(30, 41, 59, 0.5); }
    .bg-blue-900-30 { background-color: rgba(30, 58, 138, 0.3); }
    .bg-slate-700-30 { background-color: rgba(51, 65, 85, 0.3); }
    .bg-blue-600 { background-color: #2563eb; }
    .bg-blue-600:hover { background-color: #1d4ed8; }
    .border { border: 1px solid; }
    .border-slate-700 { border-color: #334155; }
    .border-blue-500-50 { border-color: rgba(59, 130, 246, 0.5); }
    .border-slate-600 { border-color: #475569; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .px-8 { padding-left: 2rem; padding-right: 2rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .text-white { color: #ffffff; }
    .font-semibold { font-weight: 600; }
    .transition { transition: all 0.2s ease; }
    .cursor-pointer { cursor: pointer; }
    .icon { font-size: 2rem; margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="text-center mb-12">
      <div class="inline-block icon">🚀</div>
      <h1>${appName}</h1>
      <p class="text-xl text-slate-300 mb-8">${appIdea}</p>
      <div class="inline-block bg-slate-800-50 border border-slate-600 rounded-lg p-6">
        <p class="text-sm text-slate-300">🎯 Built for: <strong>${targetUser}</strong></p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid gap-8 mb-12" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
      <div class="bg-slate-800-50 border border-slate-700 rounded-xl p-8">
        <h2 style="color: #60a5fa;">The Problem</h2>
        <p class="text-slate-300">${problemSolved}</p>
      </div>
      <div class="bg-slate-800-50 border border-slate-700 rounded-xl p-8">
        <h2 style="color: #4ade80;">The Solution</h2>
        <p class="text-slate-300">${howItWorks}</p>
      </div>
    </div>

    <!-- Status -->
    <div class="bg-blue-900-30 border border-blue-500-50 rounded-xl p-8 text-center">
      <p class="text-lg mb-4">⚙️ Your app is being built...</p>
      <p class="text-slate-300 mb-6">The AI-generated version of your app is processing. This is the placeholder while it builds.</p>
      <button class="bg-blue-600 bg-blue-600:hover text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer" onclick="location.reload()">
        Refresh Page
      </button>
    </div>

    <!-- Features Coming Soon -->
    <div class="mt-12">
      <h2 class="text-2xl font-semibold mb-6 text-center">What's Coming</h2>
      <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
        <div class="bg-slate-700-30 border border-slate-600 rounded-lg p-6">
          <div class="icon">✨</div>
          <p class="text-slate-300">Custom built for your needs</p>
        </div>
        <div class="bg-slate-700-30 border border-slate-600 rounded-lg p-6">
          <div class="icon">⚡</div>
          <p class="text-slate-300">Fast and responsive</p>
        </div>
        <div class="bg-slate-700-30 border border-slate-600 rounded-lg p-6">
          <div class="icon">🔒</div>
          <p class="text-slate-300">Secure and reliable</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-12 text-slate-400 text-sm">
      <p>Built with AI • ${new Date().getFullYear()}</p>
    </div>
  </div>
  
  <script>
    // Auto-refresh every 5 seconds to check if AI-generated app is ready
    setTimeout(() => {
      location.reload();
    }, 5000);
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

