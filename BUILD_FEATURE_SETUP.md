# Build the Damn Thing! - BEGINNER SETUP GUIDE

## What Are These "Tokens"?

Think of a **token** like a **special key** that gives "Build the Damn Thing!" permission to:
- Create new projects on GitHub
- Deploy projects to Netlify

You need to give it these keys so users can build apps without doing anything complicated.

---

## 🔑 Step 1: Create Your GitHub Key (Token)

### What You're Doing:
Creating a special password that lets Take The Reins create repos on your GitHub account.

### How To Do It (Copy Each Step Exactly):

1. **Open this link in your browser:**
   ```
   https://github.com/settings/tokens
   ```
   (This is GitHub's "create tokens" page)

2. **You'll see a button that says "Generate new token"**
   - Click on the dropdown arrow next to it
   - Select **"Generate new token (classic)"**

3. **Fill out the form:**
   - **Token name:** Type: `take-the-reins-build`
   
4. **See the list of "Scopes"?** (Scopes = permissions)
   - Find and **CHECK** these two boxes:
     - ☑ `repo` 
     - ☑ `user`
   
   These tell GitHub: "Allow this key to create projects and read profile info"

5. **Scroll down and click "Generate token"**

6. **IMPORTANT: Copy the token that appears!**
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxx`
   - Click the copy icon (📋) next to it
   - Open Notepad and paste it somewhere safe
   - **You won't be able to see it again!**

---

## 🔑 Step 2: Create Your Netlify Key (Token)

### What You're Doing:
Creating another special password that lets Take The Reins deploy apps to Netlify.

### How To Do It:

1. **Open this link:**
   ```
   https://app.netlify.com/user/settings/applications
   ```

2. **Scroll down until you see "Personal access tokens"**

3. **Click "New access token"**

4. **Give it a name:**
   - Type: `take-the-reins-build`

5. **Click "Generate token"**

6. **Copy this token too!**
   - Click copy (📋)
   - Paste it in Notepad next to your GitHub token
   - **You won't see it again!**

---

## ⚙️ Step 3: Add Keys to Netlify (The Important Part)

This is where you tell Netlify to use these keys.

### How To Do It:

1. **Go to your Netlify dashboard:**
   ```
   https://app.netlify.com
   ```

2. **Click on your site** (take-the-reins or whatever it's called)

3. **Click "Site settings"**

4. **On the left menu, click "Build & Deploy"**

5. **Click "Environment"**

6. **Click "Edit variables"**

7. **Add Three Keys:**
   
   You're going to add 3 pieces of information. For each one:
   - Click "New variable"
   - In "Key" type the name (exactly as written)
   - In "Value" paste the token from Notepad

   **Add these three:**
   
   | Key | Value |
   |-----|-------|
   | `GITHUB_TOKEN` | Paste your GitHub token here |
   | `NETLIFY_TOKEN` | Paste your Netlify token here |
   | `GITHUB_USERNAME` | Type: `SarahBRichey1961` |

8. **Click "Save"**

9. **Go back to Netlify main page and "Redeploy":**
   - Click "Deploys"
   - Click "Trigger deploy"
   - Wait a few minutes for it to finish

---

## ✅ You're Done!

Once those three keys are saved and the site is redeployed, **anyone can use the "Build It, Test It, Deploy It!" button without any setup.**

They'll just:
1. Go to `/hub/build`
2. Describe their idea
3. Click the button
4. Their app opens in a new tab - LIVE! 🎉

---

## 🆘 If Something Goes Wrong

**"I can't find the Generate token button"**
- Make sure you're at https://github.com/settings/tokens
- Look for a big button that says "Generate new token"
- If it says "Generate new token (classic)" - that's the one to click

**"I don't see the Netlify Environment page"**
- Go to https://app.netlify.com
- Click your site name
- Click "Site settings" (at the top)
- On the LEFT side, click "Build & Deploy"
- Then click "Environment"

**"The app still doesn't work"**
- Double-check the three keys are in Netlify with EXACT spelling
- Make sure you redeployed (waited for the deploy to finish - green checkmark)
- Try clearing your browser cache (Ctrl+Shift+Delete) and refresh

---

## 💡 That's It!

You don't need to understand how tokens work technically. You just need:
1. Generate 2 tokens from GitHub and Netlify
2. Paste them into Netlify environment
3. Redeploy
4. Done!

The feature is now live and ready for anyone to use. 🚀
