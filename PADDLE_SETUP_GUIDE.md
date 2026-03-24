# Paddle Payment Integration Setup Guide

## Overview
This document explains how to configure Paddle as the payment processor for Take The Reins.

## Prerequisites
- Paddle account (create at https://www.paddle.com)
- Admin access to your Paddle dashboard
- Access to Netlify/deployment environment variables

## Step 1: Create Products in Paddle

1. Go to [Paddle Dashboard](https://dashboard.paddle.com)
2. Navigate to **Catalog → Products**
3. Create 6 products total (3 for Sponsors, 3 for Advertisers):

### Sponsor Products

#### 1. Sponsor Monthly
- **Name:** Take The Reins Sponsor - Monthly
- **Type:** Standard
- **Default Price:** $199/month
- **Pricing Model:** Recurring (Monthly)

#### 2. Sponsor Annual
- **Name:** Take The Reins Sponsor - Annual
- **Type:** Standard
- **Default Price:** $1,999/year
- **Pricing Model:** Recurring (Annual)

#### 3. Sponsor One-Time
- **Name:** Take The Reins Sponsor - One-Time
- **Type:** Standard
- **Default Price:** $499
- **Pricing Model:** Standard (One-time)

### Advertiser Products

#### 4. Advertiser Monthly
- **Name:** Take The Reins Advertiser - Monthly
- **Type:** Standard
- **Default Price:** $199/month
- **Pricing Model:** Recurring (Monthly)

#### 5. Advertiser Annual
- **Name:** Take The Reins Advertiser - Annual
- **Type:** Standard
- **Default Price:** $1,999/year
- **Pricing Model:** Recurring (Annual)

#### 6. Advertiser One-Time
- **Name:** Take The Reins Advertiser - One-Time
- **Type:** Standard
- **Default Price:** $499
- **Pricing Model:** Standard (One-time)

## Step 2: Get Price IDs

After creating products, click on each one to view its **Prices** section:

1. For each price, copy the **Price ID** (format: `PRC_xxxxxxxxxxxxx`)
2. Record all 6 price IDs in your notes:

```
PADDLE_SPONSOR_MONTHLY_PRICE_ID = PRC_xxx
PADDLE_SPONSOR_ANNUAL_PRICE_ID = PRC_xxx
PADDLE_SPONSOR_ONETIME_PRICE_ID = PRC_xxx
PADDLE_ADVERTISER_MONTHLY_PRICE_ID = PRC_xxx
PADDLE_ADVERTISER_ANNUAL_PRICE_ID = PRC_xxx
PADDLE_ADVERTISER_ONETIME_PRICE_ID = PRC_xxx
```

## Step 3: Generate API Key

1. In Paddle Dashboard, go to **Settings → Developer Profile**
2. Under **API Keys**, click **Create Key**
3. Set permissions:
   - ✓ Checkouts (read, create)
   - ✓ Customers (read, create, update)
   - ✓ Transactions (read)
   - ✓ Subscriptions (read, update, cancel)
4. Copy the API key (looks like: `pd_xxx_...`)

## Step 4: Set Up Webhook

1. In Paddle Dashboard, go to **Settings → Webhooks**
2. Click **Add Endpoint**
3. Enter Webhook URL:
   ```
   https://takethereins.com/api/paddle/webhook
   ```
4. Select events to receive:
   - ✓ checkout.completed
   - ✓ subscription.created
   - ✓ subscription.updated
   - ✓ subscription.canceled
   - ✓ transaction.completed
   - ✓ transaction.refunded
5. Click **Save**
6. Copy the **Webhook Secret** (shown in endpoint details)

## Step 5: Configure Environment Variables

Add these to your Netlify environment variables:

```env
PADDLE_API_KEY=pd_xxx_...
PADDLE_WEBHOOK_SECRET=pdws_xxx...
PADDLE_SPONSOR_MONTHLY_PRICE_ID=PRC_xxx
PADDLE_SPONSOR_ANNUAL_PRICE_ID=PRC_xxx
PADDLE_SPONSOR_ONETIME_PRICE_ID=PRC_xxx
PADDLE_ADVERTISER_MONTHLY_PRICE_ID=PRC_xxx
PADDLE_ADVERTISER_ANNUAL_PRICE_ID=PRC_xxx
PADDLE_ADVERTISER_ONETIME_PRICE_ID=PRC_xxx
```

### Steps to add to Netlify:
1. Go to your Netlify site dashboard
2. **Settings → Build & Deploy → Environment**
3. Click **Edit Variables** (or scroll to Environment section)
4. Add each variable as a key-value pair
5. **Save** changes
6. Trigger a build in **Deploys → Trigger Deploy** 

## Step 6: Verify Integration

### Test with Paddle's Checkout Link
1. Go to any Product in Paddle Dashboard
2. Click the **Paddle Checkout** button
3. Should load Paddle's checkout interface successfully

### Test Local Checkout
1. In development, run your app locally
2. Go to `/pricing` page
3. Log in with a test account
4. Click a "Choose Plan" button
5. Should redirect to Paddle checkout URL

### Test Webhook
1. In Paddle Dashboard, go to **Settings → Webhooks**
2. Find your endpoint, click **Test Event**
3. Select `checkout.completed`
4. Paddle will send test webhook
5. Check your server logs for webhook processing

## Troubleshooting

### Issue: "Paddle checkout URL not returned"
- Check that `PADDLE_API_KEY` is set correctly
- Verify price IDs exist and are spelled correctly
- Ensure API key has "Checkouts (create)" permission

### Issue: Webhook not processing
- Verify webhook signature in environment variables
- Check that webhook URL is accessible from internet
- Review Paddle webhook logs for error details
- Ensure `/api/paddle/webhook` path is correct

### Issue: Database not updating after payment
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check browser console for errors
- Review server logs for database operation failures
- Ensure custom_data is being passed with userId and userType

## Migration Notes

**From Stripe to Paddle:**
- Database schema unchanged: `payment_status`, `subscription_type`, `subscription_end_date` fields work with both
- Webhook security: Different signature verification method (HMAC-SHA256 with header)
- API structure: Paddle uses `price_id` instead of `product_id`
- Checkout flow: Similar user experience, URL changes

## Reference Links

- [Paddle API Documentation](https://developer.paddle.com)
- [Paddle Checkout Guide](https://developer.paddle.com/build/checkout/overview)
- [Paddle Webhooks](https://developer.paddle.com/webhooks/overview)
- [Paddle Dashboard](https://dashboard.paddle.com)

## Success Indicators

✅ If this is working correctly:
1. `/pricing` page loads without errors
2. Clicking "Choose Plan" button shows Paddle checkout
3. Test payment creates record in sponsor_memberships or advertiser_accounts
4. Webhook logs show successful payment processing
5. Database reflects payment_status = 'paid'
6. Subscription end dates are calculated correctly (1 month/1 year for recurring)
