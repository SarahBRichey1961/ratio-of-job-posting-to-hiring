# Monetization System - Take The Reins Platform

## Overview

The Take The Reins platform now supports two monetization pathways:

1. **Sponsor Memberships** - Companies or individuals sponsor the platform
2. **Advertisements** - Companies advertise their products/services with rotating banner ads

## Pricing Structure

Both sponsors and advertisers have the same pricing options:

- **Monthly Subscription:** $199/month (billed monthly)
- **Annual Subscription:** $1,999/year (billed once, save ~$387)
- **One-Time Payment:** $499 (perpetual access)

### Advertiser Plan Includes

- Up to **5 active advertisements** at any given time
- Access to `/advertiser/dashboard` for ad management
- Real-time analytics (impressions, clicks, CTR)
- Ad rotation across all platform pages
- Click tracking and performance metrics

## How It Works

### For Sponsors

**Signup:**
1. Go to `/auth/signup`
2. Check the "Sponsor the platform" checkbox
3. Complete the signup
4. Complete payment (Stripe integration coming soon)

**Profile:**
- Sponsors can update their information in the sponsor dashboard (coming soon)
- View sponsor tier status (basic, premium, enterprise)
- Manage logo and branding

### For Advertisers  

**Signup:**
1. Go to `/auth/signup`
2. Check the "Advertise with us" checkbox
3. Enter your company name
4. Complete the signup
5. Complete payment (Stripe integration coming soon)

**Create Advertisements:**
1. Go to `/advertiser/dashboard`
2. Click "Create New Ad" (limited to 5 active ads)
3. Fill in:
   - **Ad Title** - Your ad campaign name
   - **Banner Image URL** - Image to display (recommended: 1200x80px)
   - **Banner Height** - Height in pixels (default 80)
   - **Click URL** - Where users are directed when clicking
   - **Alt Text** - Accessibility text
   - **Description** (optional) - Internal notes
4. Submit to create ad (will appear in rotation immediately)

**Manage Advertisements:**
- View all your ads on the dashboard
- Monitor impressions, clicks, and CTR
- Delete ads to free up slots
- Maximum of **5 active ads per advertiser** at any time

**Track Performance:**
- View impressions (times ad was displayed)
- Track clicks (how many times users clicked)
- Monitor CTR (click-through rate)

### For Users

**Ad Viewing:**
- Rotating ad banner appears at the top of:
  - Dashboard home page
  - Job board comparison page
  - Hub community page
- Ads cycle through all active ads every **2 minutes**
- Ads rotate from up to **50 active advertisements** on the platform
- Dot indicators show current position in rotation

**Clicking Ads:**
- Click an ad to visit the advertiser's link
- Click tracking is recorded for advertisers
- No personal data is collected (only session-based tracking)

---

## Database Structure

### Tables Created

#### `sponsor_memberships`
Stores sponsor account information:
- `user_id` - Reference to auth user
- `is_sponsor` - Boolean sponsor status
- `sponsor_name` - Company/person name
- `logo_url` - Logo for display
- `sponsor_tier` - basic, premium, or enterprise
- `created_at`, `updated_at` - Timestamps

#### `advertiser_accounts`
Stores advertiser account information:
- `user_id` - Reference to auth user
- `company_name` - Company name (required)
- `website` - Company website
- `contact_email` - Contact email
- `created_at`, `updated_at` - Timestamps

#### `advertisements`
Stores the actual ad content:
- `id` - Unique ad identifier
- `advertiser_id` - Reference to advertiser account
- `title` - Ad title
- `description` - Internal description
- `banner_image_url` - Image URL
- `banner_height` - Height in pixels
- `click_url` - Destination URL
- `alt_text` - Accessibility text
- `is_active` - Whether ad is currently active
- `impressions` - Count of times displayed
- `clicks` - Count of times clicked
- `expires_at` - Optional expiration date

#### `ad_impressions`
Tracks every time an ad is displayed:
- `ad_id` - Reference to ad
- `impression_timestamp` - When shown
- `page_type` - comparison, search, or hub
- `user_session_id` - Anonymous session tracking

#### `ad_clicks`
Tracks every time an ad is clicked:
- `ad_id` - Reference to ad
- `click_timestamp` - When clicked
- `page_type` - Where it was clicked from
- `user_session_id` - Anonymous session tracking

---

## API Endpoints

### Sponsor Management

**Create/Update Sponsor:**
```
POST /api/monetization/sponsor
Headers: Authorization: Bearer {token}
Body: {
  is_sponsor: boolean,
  sponsor_name?: string,
  logo_url?: string,
  sponsor_tier?: 'basic' | 'premium' | 'enterprise'
}
```

**Get Sponsor Info:**
```
GET /api/monetization/sponsor
Headers: Authorization: Bearer {token}
```

### Advertiser Management

**Create/Update Advertiser Account:**
```
POST /api/monetization/advertiser
Headers: Authorization: Bearer {token}
Body: {
  company_name: string,
  website?: string,
  contact_email?: string
}
```

**Get Advertiser Info:**
```
GET /api/monetization/advertiser
Headers: Authorization: Bearer {token}
```

### Advertisement Management

**Create Advertisement:**
```
POST /api/monetization/ads
Headers: Authorization: Bearer {token}
Body: {
  title: string,
  description?: string,
  banner_image_url: string,
  banner_height?: number,
  click_url: string,
  alt_text?: string,
  expires_at?: ISO8601 date
}

Response Status:
- 201: Ad created successfully
- 403: Ad limit reached (maximum 5 active ads per advertiser)
- 400: Missing required fields
- 401: Unauthorized
```

**Advertiser Ad Limit**
- Maximum **5 active advertisements** per advertiser account
- Attempting to create more than 5 active ads returns 403 error
- Delete or deactivate ads to create new ones

**Get All Ads (for advertiser):**
```
GET /api/monetization/ads
Headers: Authorization: Bearer {token}
```

**Get Specific Ad (with analytics):**
```
GET /api/monetization/ads/{id}
Headers: Authorization: Bearer {token}
```

**Delete Ad:**
```
DELETE /api/monetization/ads/{id}
Headers: Authorization: Bearer {token}
```

---

## Component: AdRotationBanner

Location: `src/components/AdRotationBanner.tsx`

**Usage:**
```tsx
import { AdRotationBanner } from '@/components/AdRotationBanner'

export default function MyPage() {
  return (
    <>
      <AdRotationBanner 
        pageType="comparison"  // or 'search' or 'hub'
        maxAds={50}
        rotationIntervalSeconds={120}
      />
      {/* Rest of page */}
    </>
  )
}
```

**Features:**
- Fetches all active ads from database
- Rotates through ads automatically
- Tracks impressions when displayed
- Tracks clicks when user clicks ad
- Shows dot indicators for pagination
- Updates click counts and impressions
- Handles loading states gracefully

---

## Pages Created

### `/advertiser/dashboard` 
Advertiser dashboard to:
- View all your ads
- Create new ads
- Delete ads
- See impressions, clicks, and CTR metrics
- Preview ad appearance

### Planned (Future)

- `/sponsor/dashboard` - Sponsor area
- `/admin/dashboard` - Admin analytics
- `/monetization/pricing` - Pricing page
- `/monetization/reports` - Detailed analytics reports

---

## Security & Row-Level Security (RLS)

All monetization tables have RLS policies enabled:

**sponsor_memberships:**
- Users can only view/edit their own records
- Public cannot access

**advertiser_accounts:**
- Users can only view/edit their own records
- Public cannot access

**advertisements:**
- Anyone can view active, non-expired ads (SELECT)
- Only ad owner can create/edit/delete (INSERT/UPDATE/DELETE)

**ad_impressions & ad_clicks:**
- Anyone can insert (tracking)
- Only ad owner can view impressions/clicks for their own ads

---

## Migration

To apply the monetization tables to your Supabase instance:

```sql
-- Run the migration file in Supabase SQL Editor:
-- supabase/migrations/create_monetization_tables.sql
```

Or Supabase applies migrations automatically on deployment.

---

## Future Enhancements

- [ ] Stripe integration for paid sponsorships
- [ ] Ad scheduling (start/end dates)
- [ ] A/B testing for ads
- [ ] Seasonal ad campaigns
- [ ] Advanced analytics dashboard
- [ ] Payment processing
- [ ] Monthly billing for advertisers
- [ ] Sponsorship tiers with benefits
- [ ] Admin approval workflow for ads
- [ ] Fraud detection for click spam

---

## Troubleshooting

### Ads Not Showing
- Verify ads are marked as `is_active = true`
- Check that `expires_at` is in the future or NULL
- Ensure advertiser account exists for the ad

### Can't Create Ads
- Make sure you're logged in
- Verify you signed up with "Advertise with us" checkbox
- Check that you haven't reached the **5 active ad limit**
- Delete or deactivate existing ads to create new ones
- Check browser console for error messages

### Ads Limit Reached
- Each advertiser account can have a maximum of **5 active advertisements**
- Delete or deactivate ads to free up slots
- Delete button available on `/advertiser/dashboard`

### Analytics Not Updating
- Impressions and clicks are tracked asynchronously
- Refresh the page to see updated metrics
- Check that pageType matches (comparison/search/hub)

---

## Example Workflow

### For New Advertiser

1. Click /auth/signup
2. Check "Advertise with us"
3. Enter company name
4. Complete signup
5. Complete payment (choose monthly/annual/one-time)
6. Redirected to /advertiser/dashboard
7. Click "Create New Ad"
8. Upload banner image (1200x80px)
9. Enter ad destination URL
10. Click "Create Advertisement"
11. Ad appears in rotation immediately
12. Monitor analytics as impressions accumulate
13. Create up to 5 ads (max limit per account)
14. Delete ads to add new ones if needed

### For User

1. Visit /dashboard/comparison
2. See rotating ad banner at the top
3. Ads change every 2 minutes
4. Click an interesting ad
5. Directed to advertiser's website
6. Advertiser sees the click in their analytics

---

## Questions?

For setup help or technical issues, check:
- [Supabase Documentation](https://supabase.com/docs)
- Relevant API endpoint code in `/src/pages/api/monetization/`
- Component code in `/src/components/AdRotationBanner.tsx`
