# Google Analytics 4 Setup Instructions

The Google Analytics 4 integration foundation has been implemented. Follow these steps to complete the setup:

## 1. Get Your Google Analytics 4 Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Select or create a property for your domain
4. In the left sidebar, go to **Admin** → **Property Settings**
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

## 2. Set Environment Variable

Create or update `.env.local` in the project root with:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Important:** Replace `G-XXXXXXXXXX` with your actual Measurement ID.

**Note:** The `NEXT_PUBLIC_` prefix makes this variable available in the browser (necessary for client-side GA tracking).

## 3. Restart Next.js Development Server

After adding the environment variable, restart your dev server:

```bash
npm run dev
# or
yarn dev
```

## 4. Verify GA Connection

1. Open your app at http://localhost:3000
2. Visit different pages to trigger page view events
3. Go back to Google Analytics → **Real-time** → **Overview**
4. You should see active users and page views appearing in real-time

## 5. (Optional) Add Custom Event Tracking

The following tracking functions are available in `src/lib/googleAnalytics.ts`:

### Ad Interactions
```typescript
import { trackAdInteraction } from '@/lib/googleAnalytics'

// When user views an ad
trackAdInteraction(adId, 'view')

// When user clicks an ad
trackAdInteraction(adId, 'click')

// When ad gets an impression
trackAdInteraction(adId, 'impression')
```

### User Engagement
```typescript
import { trackEngagement } from '@/lib/googleAnalytics'

// Track time spent on a page
trackEngagement('dashboard-insights', 180) // 180 seconds
```

### Sign Ups
```typescript
import { trackSignUp } from '@/lib/googleAnalytics'

// Track sign up event
trackSignUp('email')
```

### Purchases/Subscriptions
```typescript
import { trackPurchase } from '@/lib/googleAnalytics'

// Track purchase event
trackPurchase(99.99, 'USD') // Premium subscription cost
```

### Generic Events
```typescript
import { trackEvent } from '@/lib/googleAnalytics'

// Track any custom event
trackEvent('custom_event_name', {
  param1: 'value1',
  param2: 'value2'
})
```

## 6. (Optional) Replace Mock Data in Traffic Metrics

The TrafficMetrics component on the Insights page currently shows mock data. To integrate real GA data:

1. Use the [Google Analytics Reporting API v4](https://developers.google.com/analytics/devguides/reporting/core/v4)
2. Or use the newer [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
3. Create an API endpoint that fetches metrics from GA
4. Update the `useEffect` in `src/components/TrafficMetrics.tsx` to call your endpoint

## Implementation Summary

✅ **Completed:**
- Added GA script tag to `_document.tsx` (loads gtag library)
- Initialized GA in `_app.tsx` with automatic page view tracking
- Created `src/lib/googleAnalytics.ts` with tracking helper functions
- Page views automatically tracked on all route changes
- All safety checks in place for client-side rendering

⏳ **Pending:**
- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`
- (Optional) Add custom event tracking throughout app
- (Optional) Integrate real GA data into TrafficMetrics component

## Files Modified

- `src/pages/_document.tsx` - Added GA script injection
- `src/pages/_app.tsx` - Added GA initialization and page view tracking
- `src/lib/googleAnalytics.ts` - Helper functions (already created)
- `.env.local` - Add your Measurement ID (you create this)

## Troubleshooting

**GA not showing events:**
1. Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly in `.env.local`
2. Check browser console for errors (press F12)
3. Ensure you've restarted the dev server after adding the env variable
4. Check Google Analytics → Real-time → Overview (should show active users)

**Events not appearing after ~30 seconds:**
1. Possible delay in GA report generation (can take 24-48 hours for full analytics)
2. Check if your IP is in [Google Analytics IP exclusion list](https://analytics.google.com/analytics/web/#/a/205636159p/admin/filters)
3. Verify the Measurement ID is correct

**Need to debug GA calls:**
Add this to your browser console to see all gtag calls:
```javascript
window.gtag = function(...args) {
  console.log('GA:', args)
}
```
