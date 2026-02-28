# Domain Migration Guide: TakeTheReins.ai

This guide walks you through connecting your Netlify deployment to your custom domain **takethereins.ai** and updating Supabase authentication settings.

---

## Step 1: Connect Domain to Netlify

### 1.1 Access Netlify Site Settings
1. Go to [Netlify](https://app.netlify.com)
2. Log in to your account
3. Select your site (the one currently deployed as `something.netlify.app`)
4. Click **Site Settings** in the top navigation

### 1.2 Add Custom Domain
1. In the left sidebar, click **Domain Management**
2. Look for the **Custom Domains** section
3. Click **Add Domain** or **Add Custom Domain**
4. Type `takethereins.ai` in the input field
5. Click **Verify** or **Add Domain**

### 1.3 Configure DNS
Netlify will show you a message with DNS configuration options. Choose ONE of these:

#### Option A: Change Nameservers (RECOMMENDED - Easier)
Netlify will display 4 nameserver addresses that look like:
```
ns1.netlify.com
ns2.netlify.com
ns3.netlify.com
ns4.netlify.com
```

1. Go to your domain registrar (where you registered takethereins.ai)
2. Find the DNS or Nameserver settings
3. Replace the existing nameservers with Netlify's 4 nameservers
4. Save the changes
5. Return to Netlify and click **Verify DNS Configuration**
6. Wait 5-30 minutes for DNS to propagate

#### Option B: Add CNAME Record (If you can't change nameservers)
If your registrar won't let you change nameservers:

1. Netlify will show a CNAME record like: `takethereins.ai CNAME some-id.netlify.com`
2. Go to your domain registrar's DNS settings
3. Add this CNAME record
4. Save and return to Netlify to verify

### 1.4 Wait for SSL Certificate
- Netlify will automatically provision a free SSL/HTTPS certificate
- This typically takes 5-30 minutes after DNS propagates
- You'll see a green checkmark ✓ when it's ready

---

## Step 2: Update Supabase Authentication URLs

### 2.1 Access Supabase Settings
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. In the left sidebar, click **Authentication**
4. Click **URL Configuration**

### 2.2 Add New Redirect URLs
In the **Redirect URLs** section, add these new URLs:

```
https://takethereins.ai
https://takethereins.ai/
https://takethereins.ai/auth/callback
https://takethereins.ai/hub
https://takethereins.ai/login
```

⚠️ **KEEP YOUR EXISTING URLs** - Don't remove localhost or preview URLs:
- Keep: `http://localhost:3000/auth/callback`
- Keep: `http://localhost:3000`
- Keep any Netlify preview URLs (for branch deploys)

Your final list should look like:
```
http://localhost:3000
http://localhost:3000/auth/callback
https://takethereins.ai
https://takethereins.ai/
https://takethereins.ai/auth/callback
https://takethereins.ai/hub
https://takethereins.ai/login
```

### 2.3 Save Changes
Click **Save** at the bottom of the URL Configuration page.

---

## Step 3: Verification Checklist

After completing steps 1-2, verify everything works:

### 3.1 DNS Propagation
- [ ] Wait 5-30 minutes for DNS to propagate
- [ ] Go to `https://takethereins.ai` in your browser
- [ ] Should load your site (not a 404 or error)

### 3.2 HTTPS Certificate
- [ ] Check the browser URL bar - should show a padlock 🔒
- [ ] Click the padlock to verify certificate is for takethereins.ai

### 3.3 Test Authentication Flow
- [ ] Go to `https://takethereins.ai/login`
- [ ] Try logging in with a test account
- [ ] After login, you should be redirected without errors
- [ ] Check browser console (F12) for any auth errors

### 3.4 Netlify Deployment
1. Go back to Netlify Site Settings
2. Scroll to **Domain Management**
3. Verify the custom domain shows:
   - ✓ Primary domain: `takethereins.ai`
   - ✓ SSL certificate: Active (green checkmark)

---

## Troubleshooting

### Domain Not Loading
- **Problem**: `takethereins.ai` shows 404 or "Cannot connect"
- **Solution**: DNS hasn't propagated yet. Wait 15-30 minutes and try again
- **Check**: Use [MXToolbox](https://mxtoolbox.com/nslookup) to check DNS status

### Auth Redirect Loop
- **Problem**: Login page redirects infinitely or to wrong page
- **Solution**: Verify Supabase redirect URLs are correct (Step 2.2)
- **Check**: Browser console (F12) → under Network tab filter by "auth"

### SSL Certificate Not Working
- **Problem**: Browser shows "Not secure" warning
- **Solution**: 
  1. Wait 15-30 minutes after DNS setup
  2. Check Netlify Site Settings → Custom domain should show green checkmark
  3. If still not working after 1 hour, contact Netlify support

### App Still Uses Old Domain
- **Problem**: Links still point to old `.netlify.app` domain
- **Solution**: All URLs in the app are relative (not hardcoded), so updating DNS is all that's needed
- **Check**: Hard refresh (Ctrl+F5) your browser cache

---

## Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Add domain to Netlify |
| 2 | 5 min | Configure DNS at registrar |
| 3 | 5-30 min | DNS propagates |
| 4 | 5 min | Update Supabase URLs |
| 5 | 5-30 min | SSL certificate provisions |
| 6 | 5 min | Test and verify |

**Total: 30-70 minutes**

---

## Need Help?

If you get stuck:
1. Check the Netlify docs: https://docs.netlify.com/domains-https/custom-domains/
2. Check Supabase docs: https://supabase.com/docs/guides/auth
3. Share the exact error message and I can help troubleshoot
