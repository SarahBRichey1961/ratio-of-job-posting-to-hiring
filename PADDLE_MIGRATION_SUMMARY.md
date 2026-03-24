# Stripe to Paddle Migration - Complete Summary

## Migration Status
✅ **Complete** - All Paddle API endpoints are created and pricing page updated.

## What Changed

### 1. API Endpoints

#### Checkout Workflow
**Before (Stripe):**
```
POST /api/stripe/checkout
  ↓ (creates Stripe session)
  ↓ Returns: { url: string, sessionId: string }
  → User redirects to Stripe checkout
```

**After (Paddle):**
```
POST /api/paddle/checkout
  ↓ (creates Paddle checkout)
  ↓ Returns: { url: string, checkoutId: string }
  → User redirects to Paddle checkout
```

#### Request/Response Format (Unchanged)
```typescript
// Request - SAME for both processors
{
  userType: 'sponsor' | 'advertiser',
  planType: 'monthly' | 'annual' | 'onetime'
}

// Response format changed (sessionId → checkoutId)
// But response.url is handled the same way
```

### 2. Webhook Handlers

#### Signature Verification
**Stripe:** Uses `stripe-signature` header with SHA256 HMAC and timestamp validation
**Paddle:** Uses `paddle-signature` header with just SHA256 HMAC

Both stored in appropriate environment variables.

#### Event Types

| Event | Stripe | Paddle | Action |
|-------|--------|--------|--------|
| Payment Complete | `checkout.session.completed` | `checkout.completed` | Create/update account record, set payment_status='paid' |
| Subscription Start | `customer.subscription.created` | `subscription.created` | Log subscription (optional) |
| Subscription Update | `customer.subscription.updated` | `subscription.updated` | Update subscription details |
| Subscription Cancel | `customer.subscription.deleted` | `subscription.canceled` | Update subscription status |
| Payment Refund | `charge.refunded` | `transaction.refunded` | Handle refunds (may revoke access) |

### 3. Database Schema (Unchanged)

All existing columns work with **both** Stripe and Paddle:
- `payment_status` - 'paid', 'pending', etc. (provider-agnostic)
- `subscription_type` - 'monthly', 'annual', 'onetime' (same values)
- `subscription_end_date` - ISO date string (calculated identically)
- **Custom columns** - Store provider-specific IDs:
  - `stripe_session_id` (old) → `paddle_checkout_id` (new)

The migration doesn't require schema changes.

### 4. Environment Variables

#### New Paddle Variables
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

#### DEPRECATED Stripe Variables
The following are no longer used (can be removed):
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SPONSOR_MONTHLY_PRICE=price_xxx
STRIPE_SPONSOR_ANNUAL_PRICE=price_xxx
STRIPE_SPONSOR_ONETIME_PRICE=price_xxx
STRIPE_ADVERTISER_MONTHLY_PRICE=price_xxx
STRIPE_ADVERTISER_ANNUAL_PRICE=price_xxx
STRIPE_ADVERTISER_ONETIME_PRICE=price_xxx
```

## Files Changed

### New Files Created
```
✨ src/pages/api/paddle/checkout.ts          - Create Paddle checkout sessions
✨ src/pages/api/paddle/webhook.ts           - Handle Paddle webhook events
✨ PADDLE_SETUP_GUIDE.md                     - Configuration instructions
```

### Updated Files
```
📝 src/pages/monetization/pricing.tsx        - Changed endpoint from /api/stripe/checkout to /api/paddle/checkout
                                             - Updated payment method text in FAQ from "Stripe" to "Paddle"
```

### Unchanged Files (Still Work)
```
✓ src/context/AuthContext.ts                 - No changes needed
✓ src/pages/api/stripe/checkout.ts           - Can be removed or kept as fallback
✓ src/pages/api/stripe/webhook.ts            - Can be removed when fully migrated
```

## Functional Flow Comparison

### User Initiates Purchase
```
[User clicks "Choose Monthly"] 
  ↓
[handleCheckout(userType, planType)]
  ↓
fetch('/api/paddle/checkout', { body: {userType, planType} })
  ↓
[Server authenticates Bearer token via Supabase]
  ↓
[Server calls Paddle API to create checkout]
  ↓
[Server returns { url: checkout_url }]
  ↓
[Frontend redirects to Paddle checkout]
```

### Payment Complete
```
[User completes Paddle checkout]
  ↓
[Paddle calls GET /api/paddle/webhook]
  ↓
[Server verifies Paddle signature with webhook secret]
  ↓
[Server parses event type: checkout.completed]
  ↓
[Server extracts userId, userType, planType from custom_data]
  ↓
[Server updates sponsor_memberships OR advertiser_accounts]
  ↓
[Server returns 200 to Paddle (webhook acknowledgement)]
  ↓
[User redirected to /monetization/success?userType=xxx]
```

## Pricing Unchanged

All pricing amounts remain the same:
```
Sponsor & Advertiser Plans:
- Monthly: $199/month
- Annual: $1,999/year  
- One-Time: $499
```

## Testing Checklist

Before launching to production:

- [ ] PADDLE_API_KEY is set in Netlify environment
- [ ] All 6 price IDs are set and valid
- [ ] PADDLE_WEBHOOK_SECRET is set
- [ ] Webhook endpoint configured in Paddle dashboard
- [ ] Webhook points to correct URL: `https://takethereins.com/api/paddle/webhook`
- [ ] Test payment goes through Paddle checkout
- [ ] Webhook is received and processed (check logs)
- [ ] Database record is created with payment_status='paid'
- [ ] User redirected to success page
- [ ] Subscription dates calculated and saved correctly
- [ ] User can see verified payment status in dashboard

## Rollback Plan

If issues occur:
1. Stop using `/api/paddle/checkout` endpoint
2. Keep Stripe endpoint available as fallback
3. Update pricing page back to `/api/stripe/checkout`
4. Monitor Stripe account status

## Why Paddle?

✓ **Better fraud detection** - Lower false positive rate than Stripe
✓ **Lower suspension risk** - Business-friendly policies
✓ **Competitive fees** - 5% + $0.50 vs Stripe's ~3% + $0.30
✓ **Global coverage** - Better international payment support
✓ **Regulatory compliance** - Clear VAT/tax handling
✓ **Reliable** - No sudden account closures

## Questions?

Refer to:
- [Paddle API Docs](https://developer.paddle.com)
- [PADDLE_SETUP_GUIDE.md](./PADDLE_SETUP_GUIDE.md) for detailed setup
- Email: support@takethereins.com
