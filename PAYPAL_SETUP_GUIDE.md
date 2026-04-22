# PayPal Integration Setup for Take The Reins

**Status:** ✅ Code fully implemented | ⏳ Awaiting configuration

---

## 🎯 Quick Setup Summary

All PayPal endpoints are built and ready. You just need to:
1. Create a PayPal Business account
2. Get API credentials from PayPal
3. Add environment variables to Netlify
4. Test with sandbox mode first

---

## Step 1: Create PayPal Business Account

1. Go to https://www.paypal.com/signin
2. Choose **Business Account** (or upgrade existing)
3. Complete business verification (may take a few minutes)

---

## Step 2: Get PayPal API Credentials

### For Sandbox (Testing)
1. Go to https://developer.paypal.com
2. Login with your PayPal account
3. Click on **Sandbox** in left menu
4. Go to **Apps & Credentials**
5. From dropdown, select **Merchant**
6. You'll see your **Sandbox Merchant Accounts**
7. Under **Default Account**, click **Show** next to Client ID and Secret

**Copy these values:**
- `PAYPAL_CLIENT_ID` (Sandbox)
- `PAYPAL_CLIENT_SECRET` (Sandbox)

### For Production (Going Live)
1. Same dashboard, switch to **Live** tab
2. Click **Apps & Credentials**
3. Take note: You'll need to create a Business app first
4. Go to **My Apps**
5. Create an app called "Take The Reins"
6. Copy credentials

---

## Step 3: Create PayPal Webhook (Required for Payments)

### Sandbox Webhook Setup
1. Go to https://developer.paypal.com
2. Stay in **Sandbox** environment
3. Go to **Webhooks** in left menu
4. Click **Create Webhook**
5. Webhook URL: `https://take-the-reins.ai/api/paypal/webhook`
   - **Note:** For testing locally, use ngrok or a tunnel service
6. Subscribe to these events:
   - ✅ `CHECKOUT.ORDER.COMPLETED`
   - ✅ `CHECKOUT.ORDER.APPROVED`
7. Click **Create Webhook**
8. Copy the **Webhook ID** that appears

**For Production:**
- Repeat steps for **Live** environment
- Use production domain: `https://take-the-reins.ai/api/paypal/webhook`

---

## Step 4: Add Variables to Netlify

### What to Add

| Variable | Value | Environment |
|----------|-------|-------------|
| `PAYPAL_MODE` | `sandbox` | All (Start with sandbox for testing) |
| `PAYPAL_CLIENT_ID` | From PayPal Sandbox | All |
| `PAYPAL_CLIENT_SECRET` | From PayPal Sandbox | All |
| `PAYPAL_WEBHOOK_ID` | From PayPal Webhooks | All |

### Steps to Add to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **ratio-of-job-posting-to-hiring**
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Click **Add Environment Variable**
5. Add each variable:
   - Name: `PAYPAL_MODE`
   - Value: `sandbox`
6. Repeat for `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
7. **Trigger a new deploy** to activate

**Important:** Do NOT commit `.env.local` to GitHub (it's already in `.gitignore`)

---

## Step 5: Test the Integration

### Test Sandbox Payment Flow

1. Go to https://take-the-reins.ai/monetization/pricing
2. Click "Get Started" on any pricing plan
3. Authenticate if needed
4. You'll be redirected to PayPal
5. Login with your **PayPal Sandbox Business Account**
6. Approve the payment
7. Check console logs for `[PayPal] ✓ Order captured`

### Test Database Updates

After successful payment:
```sql
SELECT * FROM sponsor_memberships WHERE user_id = '<your-user-id>';
-- Or for advertisers:
SELECT * FROM advertiser_accounts WHERE user_id = '<your-user-id>';
```

You should see:
- `payment_status: 'paid'`
- `is_active: true` (or `is_sponsor: true`)
- `subscription_end_date` (for monthly/annual plans)

---

## Step 6: Switch to Production

Once sandbox testing works:

### Get Production Credentials
1. Go to https://developer.paypal.com → **Live** tab
2. Create a business app if you haven't
3. Copy Client ID and Secret

### Create Production Webhook
1. Go to Webhooks in **Live** environment
2. Add webhook: `https://take-the-reins.ai/api/paypal/webhook`
3. Subscribe to same events
4. Copy Webhook ID

### Update Netlify Variables
1. Update in Netlify:
   - `PAYPAL_MODE`: `production`
   - `PAYPAL_CLIENT_ID`: (production value)
   - `PAYPAL_CLIENT_SECRET`: (production value)
   - `PAYPAL_WEBHOOK_ID`: (production value)
2. Trigger deploy
3. Test with real PayPal account

---

## What's Already Built

### API Endpoints
- ✅ **POST** `/api/paypal/checkout` - Creates PayPal order
- ✅ **POST** `/api/paypal/capture` - Captures payment after approval
- ✅ **POST** `/api/paypal/webhook` - Receives payment confirmations

### Frontend
- ✅ Pricing page with PayPal buttons
- ✅ Success page with order confirmation
- ✅ Error handling and user feedback

### Database
- ✅ Auto-updates `sponsor_memberships` on sponsor payment
- ✅ Auto-updates `advertiser_accounts` on advertiser payment
- ✅ Calculates subscription end dates for monthly/annual plans
- ✅ Lifetime access for one-time payments

### Pricing
```
Sponsors & Advertisers:
- Monthly:  $199.00
- Annual:   $1,999.00
- One-time: $499.00
```

---

## Troubleshooting

### "PayPal not configured on server"
- **Fix:** Check that environment variables are set in Netlify
- Redeploy after adding variables

### "Failed to get PayPal access token"
- **Fix:** Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct
- Check they're for the right environment (sandbox vs production)

### Payment captured but database not updated
- **Fix:** Check `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify
- This is required for database writes

### Webhook not receiving events
- **Fix:** Check webhook URL is public and accessible
- Verify webhook is activated in PayPal dashboard
- For local testing, use ngrok: `ngrok http 3000`
- Update webhook URL to ngrok tunnel

---

## Monitoring

### Check Payment Status
```sql
-- Recent payments
SELECT user_id, payment_status, subscription_type, created_at 
FROM sponsor_memberships 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Active Subscriptions
```sql
-- Expired memberships
SELECT user_id, subscription_end_date 
FROM sponsor_memberships 
WHERE payment_status = 'paid' 
AND subscription_end_date < now();
```

---

## Security Notes

- ✅ Bearer token validation on checkout endpoint
- ✅ Webhook signature verification (if `PAYPAL_WEBHOOK_ID` set)
- ✅ Service role key for database writes
- ✅ Never commit secrets to GitHub (`.env.local` is gitignored)
- ✅ All sensitive data passed via secure environment variables

---

## Next Steps

1. **Start sandbox mode** (use sandbox credentials for testing)
2. **Test full payment flow** before going live
3. **Monitor transactions** in PayPal dashboard
4. **Gather user feedback** on checkout experience
5. **Switch to production** when ready (change `PAYPAL_MODE` to production)

---

## Support

PayPal Docs: https://developer.paypal.com/docs/checkout/
PayPal API Reference: https://developer.paypal.com/api/overview/
