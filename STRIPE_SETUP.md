# Stripe Payment Integration Setup

## Overview

The Take The Reins monetization system uses Stripe to process payments for:
- **Sponsor Memberships** - $199/month, $1,999/year, or $499 one-time
- **Advertiser Accounts** - $199/month, $1,999/year, or $499 one-time

## Environment Variables Required

Add these to your `.env.local` file:

```
# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_xxxxx  # Secret key (server-side only)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_xxxxx  # Public key (client-side)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Webhook signing secret

# For Stripe Checkout
NEXT_PUBLIC_APP_URL=http://localhost:3000  # In production: https://yourdomain.com
```

## API Endpoints

### POST /api/stripe/checkout

Creates a Stripe checkout session for payment.

**Headers:**
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "userType": "sponsor" | "advertiser",
  "planType": "monthly" | "annual" | "onetime"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

**Usage Example:**
```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    userType: 'advertiser',
    planType: 'monthly'
  })
})

const { url } = await response.json()
window.location.href = url
```

### POST /api/stripe/webhook

Stripe sends webhook events to this endpoint when payments are processed.

**Events Handled:**
- `checkout.session.completed` - Payment successful, updates payment status
- `customer.subscription.deleted` - Subscription cancelled
- `charge.refunded` - Refund processed

## Database Schema Updates

The following columns were added to track payment status:

**sponsor_memberships:**
- `payment_status` - 'unpaid' | 'paid' | 'cancelled'
- `subscription_type` - 'monthly' | 'annual' | 'onetime'
- `stripe_session_id` - Stripe checkout session ID
- `subscription_end_date` - When subscription expires (null for one-time)
- `stripe_customer_id` - Stripe customer ID

**advertiser_accounts:**
- `payment_status` - 'unpaid' | 'paid' | 'cancelled'
- `subscription_type` - 'monthly' | 'annual' | 'onetime'
- `stripe_session_id` - Stripe checkout session ID
- `subscription_end_date` - When subscription expires (null for one-time)
- `stripe_customer_id` - Stripe customer ID

## Setup Instructions

### 1. Create Stripe Account
- Go to https://stripe.com
- Sign up and create a new account
- Verify your email

### 2. Get API Keys
- Go to https://dashboard.stripe.com/apikeys
- Copy your Secret Key (starts with `sk_`)
- Copy your Publishable Key (starts with `pk_`)
- Add both to your `.env.local`

### 3. Set Up Webhooks
- Go to https://dashboard.stripe.com/webhooks
- Click "Add endpoint"
- Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `charge.refunded`
- Copy the Signing Secret (starts with `whsec_`)
- Add to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 4. Deploy
- Add all environment variables to your Netlify site settings
- Deploy the updated code
- In production, make sure `NEXT_PUBLIC_APP_URL` points to your domain

## Payment Flow

### User Signs Up

```
User visits /auth/signup
  ↓
Selects "Sponsor the platform" or "Advertise with us"
  ↓
Creates account
  ↓
Redirected to /monetization/pricing
  ↓
Creates placeholder record with payment_status: 'unpaid'
```

### User Makes Payment

```
User selects plan (monthly/annual/one-time)
  ↓
POST /api/stripe/checkout
  ↓
Stripe checkout session created
  ↓
User redirected to Stripe checkout
  ↓
User enters payment info
  ↓
Payment processed
  ↓
Redirected to /monetization/success
```

### Stripe Webhook Confirms Payment

```
Stripe → POST /api/stripe/webhook (checkout.session.completed)
  ↓
Payment status updated to 'paid'
  ↓
subscription_type set to selected plan
  ↓
subscription_end_date calculated (if applicable)
  ↓
User can now access features
```

## Feature Gating (To Be Implemented)

Sponsors and Advertisers should be restricted to paid features until `payment_status === 'paid'`:

```typescript
// Check if user has paid
const isAdvertiser = advertiser?.payment_status === 'paid'

// Only allow ad creation if paid
if (!isAdvertiser) {
  return <BuyNowButton />
}
```

## Testing

### Test Cards

Use these card numbers to test without real payments:

| Card Number | Expiry | CVC | Result |
|---|---|---|---|
| 4242 4242 4242 4242 | Any future | Any | Success |
| 4000 0025 0000 3155 | Any future | Any | Requires auth |
| 5555 5555 5555 4444 | Any future | Any | Success (Mastercard) |

You can use `4242 4242 4242 4242` to test successful payments in development.

### Testing Webhooks Locally

Use Stripe CLI to test webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or https://stripe.com/docs/stripe-cli

# Login to your account
stripe login

# Start webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Troubleshooting

### Payment fails with "Missing API key"
- Verify `STRIPE_SECRET_KEY` is set in `.env.local`
- In production, check Netlify environment variables

### Webhook not updating database
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check server logs for webhook errors
- Ensure Stripe webhook is configured with correct URL

### User stuck on checkout page
- Verify `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` is set
- Check browser console for errors
- Try refreshing the page

### subscription_end_date not calculated
- One-time payments should have `null` (not expiring)
- Monthly subscriptions should expire one month later
- Annual subscriptions should expire one year later

## Pricing

Current pricing:
- **Monthly:** $199/month (billed monthly)
- **Annual:** $1,999/year (billed once, saves ~$387)
- **One-Time:** $499 (perpetual access)

Same pricing for both sponsors and advertisers.

## Future Enhancements

- [ ] Subscription management page (change plan, cancel)
- [ ] Invoice history
- [ ] Refund processing UI
- [ ] Trial periods
- [ ] Promotional codes
- [ ] Custom pricing tiers
- [ ] Usage-based billing
- [ ] Dunning (retry failed payments)

## Support

For Stripe-related issues:
- Check Stripe Dashboard: https://dashboard.stripe.com
- Stripe Documentation: https://stripe.com/docs
- Contact Stripe Support: https://support.stripe.com

For application issues:
- Check server logs
- Open GitHub issue
- Contact support@takethereins.com
