# Set PayPal Environment Variables on Netlify

The PayPal checkout endpoint is returning 500 because `PAYPAL_CLIENT_SECRET` is missing on the production server.

## Quick Fix (3 minutes):

### Step 1: Go to Netlify Dashboard
https://app.netlify.com/sites/take-the-reins/settings/deploys

### Step 2: Click "Build & Deploy" in left menu
Then click "Environment" tab

### Step 3: Add These 4 Variables

Click "Add a variable" for each:

**1. PAYPAL_MODE**
- Key: `PAYPAL_MODE`
- Value: `production`
- Click Save

**2. PAYPAL_CLIENT_ID**
- Key: `PAYPAL_CLIENT_ID`
- Value: `AZ1QA-kO8P5fX-IRWR7vD-yzLoS_PgaEs_xlzp0YFQhtTQUKTXzs1CJFELF3mMKWR8nnshN5XMEbyyRP`
- Click Save

**3. PAYPAL_CLIENT_SECRET** ⭐ **IMPORTANT**
- Key: `PAYPAL_CLIENT_SECRET`
- Value: `EDU9wfVstoIez2Jj3lv2q-lJwDPOHXwLkDBC8kNbU_0oahIbynjZsGrp9hZYIsKt1GghB82XuxxThcW5`
- Click Save

**4. PAYPAL_WEBHOOK_ID**
- Key: `PAYPAL_WEBHOOK_ID`
- Value: `EB8jG_4xVtYO3BayjS6zd7M3QhKBSXxwgJwU7TZMUb5-QKkLQ-QmATB_AsTfibH5tR5xuVUOk3PrlN__`
- Click Save

### Step 4: Trigger New Deploy

Go to https://app.netlify.com/sites/take-the-reins/deploys

Click **"Trigger deploy"** → **"Deploy site"**

Wait 3-5 minutes for deployment to complete (green checkmark = done)

### Step 5: Test

1. Go to https://take-the-reins.ai/monetization/pricing
2. Click any pricing button
3. Click **"Continue to PayPal Payment"**
4. Should now redirect to PayPal checkout (no 500 error)

---

## If You Have Questions

The values are in your `.env.local` file locally - these are the production credentials from your PayPal account. They're already deployed in `netlify.toml` but you need to confirm them in the UI.
