# PayPal Setup Checklist

## Phase 1: PayPal Account & Credentials ⏳
- [ ] Create PayPal Business Account (https://www.paypal.com/signin)
- [ ] Verify business information (may take a few minutes)
- [ ] Access PayPal Developer Dashboard (https://developer.paypal.com)
- [ ] Get **Sandbox** credentials:
  - [ ] Copy `PAYPAL_CLIENT_ID` (sandbox)
  - [ ] Copy `PAYPAL_CLIENT_SECRET` (sandbox)

## Phase 2: Sandbox Webhook Setup ⏳
- [ ] Go to PayPal Developer → Webhooks → Sandbox
- [ ] Create new webhook
- [ ] Set URL to: `https://take-the-reins.ai/api/paypal/webhook`
- [ ] Subscribe to: `CHECKOUT.ORDER.COMPLETED` + `CHECKOUT.ORDER.APPROVED`
- [ ] Copy `PAYPAL_WEBHOOK_ID`

## Phase 3: Configure Netlify ⏳
- [ ] Login to Netlify (https://app.netlify.com)
- [ ] Select site: **ratio-of-job-posting-to-hiring**
- [ ] Go to Settings → Build & Deploy → Environment
- [ ] Add 4 variables:
  - [ ] `PAYPAL_MODE` = `sandbox`
  - [ ] `PAYPAL_CLIENT_ID` = (sandbox value)
  - [ ] `PAYPAL_CLIENT_SECRET` = (sandbox value)
  - [ ] `PAYPAL_WEBHOOK_ID` = (sandbox value)
- [ ] Trigger new deploy

## Phase 4: Canvas Testing ✅
- [ ] Go to: https://take-the-reins.ai/monetization/pricing
- [ ] Click pricing button → Sign in if needed
- [ ] Verify redirected to PayPal
- [ ] Complete sandbox payment (use test PayPal account)
- [ ] Confirm redirect back to success page
- [ ] Check database updated (run queries below)

## Phase 5: Verify Database Updates ✅
```sql
-- Check if payment was recorded
SELECT * FROM sponsor_memberships WHERE user_id = '<your-user-id>';
-- OR
SELECT * FROM advertiser_accounts WHERE user_id = '<your-user-id>';

-- Verify columns:
-- ✅ payment_status = 'paid'
-- ✅ is_active = true (or is_sponsor = true for sponsors)
-- ✅ subscription_end_date set correctly
```

## Phase 6: Monitor Webhook Events ⏳
- [ ] Check Netlify logs for `[PayPal] ✓ Order captured` messages
- [ ] Go to PayPal Dev Dashboard → Webhooks → Event Log
- [ ] Verify webhook events received and processed

## Phase 7: Get Production Credentials ⏳
- [ ] Go to PayPal Developer → **Live** tab
- [ ] Create business app (or find existing)
- [ ] Copy `PAYPAL_CLIENT_ID` (production)
- [ ] Copy `PAYPAL_CLIENT_SECRET` (production)

## Phase 8: Setup Production Webhook ⏳
- [ ] In PayPal Dev Dashboard → Webhooks → **Live** tab
- [ ] Create new webhook
- [ ] Set URL to: `https://take-the-reins.ai/api/paypal/webhook`
- [ ] Subscribe to same events
- [ ] Copy production `PAYPAL_WEBHOOK_ID`

## Phase 9: Switch to Production ⏳
- [ ] Update Netlify variables to production values:
  - [ ] `PAYPAL_MODE` = `production`
  - [ ] `PAYPAL_CLIENT_ID` = (production)
  - [ ] `PAYPAL_CLIENT_SECRET` = (production)
  - [ ] `PAYPAL_WEBHOOK_ID` = (production)
- [ ] Trigger new deploy
- [ ] Test with real PayPal payment

## Phase 10: Launch & Monitor ⏳
- [ ] Announce PayPal payments available
- [ ] Monitor transaction volume in PayPal dashboard
- [ ] Check webhook event logs regularly
- [ ] Monitor Netlify logs for any errors
- [ ] Set up alerts for payment failures

---

## Quick Reference

**Sandbox Testing Credentials:**
Create test accounts at: https://developer.paypal.com/dashboard/accounts

| Account Type | Email | Password |
|---|---|---|
| Buyer | (auto-generated) | (auto-generated) |
| Merchant | (auto-generated) | (auto-generated) |

**Current Implementation:**
- Pricing: $199/mo, $1,999/yr, $499 one-time
- Supports: Sponsors & Advertisers
- Auto-calculates subscription end dates

