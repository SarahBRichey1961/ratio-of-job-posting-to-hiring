/**
 * Google Analytics 4 Configuration
 */

// Your GA4 Measurement ID (set in environment variables)
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

/**
 * Initialize Google Analytics
 * Call this once on app startup
 */
export const initializeGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not configured')
    return
  }

  // GA script is loaded in _document.tsx
  // This function can be used for additional initialization if needed
  console.log('✅ Google Analytics initialized with ID:', GA_MEASUREMENT_ID)
}

/**
 * Track page view
 */
export const trackPageView = (path: string, title: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    })
  }
}

/**
 * Track custom event
 */
export const trackEvent = (eventName: string, eventParams?: any) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams)
  }
}

/**
 * Track user engagement
 */
export const trackEngagement = (page: string, timeSpent: number) => {
  trackEvent('page_engagement', {
    page: page,
    time_spent: timeSpent,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track ad interaction
 */
export const trackAdInteraction = (adId: string, action: 'view' | 'click' | 'impression') => {
  trackEvent('ad_interaction', {
    ad_id: adId,
    action: action,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track sign up event
 */
export const trackSignUp = (signupMethod: string) => {
  trackEvent('sign_up', {
    method: signupMethod,
  })
}

/**
 * Track purchase/subscription event
 */
export const trackPurchase = (value: number, currency: string = 'USD') => {
  trackEvent('purchase', {
    value: value,
    currency: currency,
  })
}

/**
 * Track search
 */
export const trackSearch = (searchTerm: string, category?: string) => {
  trackEvent('search', {
    search_term: searchTerm,
    category: category,
  })
}
