import { useEffect, useState, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Ad {
  id: string
  title: string
  description: string
  banner_image_url: string
  banner_height: number
  click_url: string
  alt_text: string
  impressions: number
  clicks: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

interface AdRotationBannerProps {
  pageType: 'comparison' | 'search' | 'hub'
  maxAds?: number
  rotationIntervalSeconds?: number
}

/**
 * Rotating advertisement banner component
 * Displays active ads cycling through every 2 minutes (or custom interval)
 * Supports up to 50 ads
 */
export const AdRotationBanner: React.FC<AdRotationBannerProps> = ({ 
  pageType, 
  maxAds = 50,
  rotationIntervalSeconds = 120 
}) => {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))

  // Keep Supabase client for tracking (impressions/clicks)
  const supabase = useMemo(() => getSupabase(), [])
  useEffect(() => {
    let isMounted = true

    const fetchAds = async (attempt: number = 0) => {
      if (!isMounted) return

      try {
        if (attempt === 0) {
          setIsLoading(true)
        }
        console.log(`[AdRotationBanner] Fetching ads from API (attempt ${attempt + 1})...`)

        // Fetch from server API (uses SERVICE_ROLE_KEY, bypasses RLS and auth issues)
        const response = await fetch('/api/ads', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // 10 second timeout (generous compared to 5 second client-side timeout)
          signal: AbortSignal.timeout(10000)
        })

        if (!isMounted) return

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()

        if (!isMounted) return

        if (result.ads && Array.isArray(result.ads)) {
          console.log(`[AdRotationBanner] ✅ Fetched ${result.ads.length} active ads from API`)
          setAds(result.ads)
        } else {
          console.warn('[AdRotationBanner] API returned no ads')
          setAds([])
        }
        setIsLoading(false)
      } catch (err) {
        if (!isMounted) return

        console.error(`[AdRotationBanner] Failed to fetch ads (attempt ${attempt + 1}):`, err)

        // Retry once on network/timeout error
        if (attempt < 1) {
          console.log('[AdRotationBanner] ⚠️ Retrying ad fetch...')
          // Exponential backoff: wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
          await fetchAds(attempt + 1)
        } else {
          console.error('[AdRotationBanner] ❌ Ad fetch failed after 2 attempts')
          setAds([])
          setIsLoading(false)
        }
      }
    }

    fetchAds(0)

    // Cleanup on unmount
    return () => {
      isMounted = false
    }
  }, [pageType, maxAds])

  // Track impression when ad is displayed
  useEffect(() => {
    if (ads.length === 0) return

    const trackImpression = async () => {
      const currentAd = ads[currentAdIndex]
      try {
        await supabase.from('ad_impressions').insert({
          ad_id: currentAd.id,
          page_type: pageType,
          user_session_id: sessionId
        })

        // Update impression count
        await supabase
          .from('advertisements')
          .update({ impressions: (ads[currentAdIndex]?.impressions || 0) + 1 })
          .eq('id', currentAd.id)
      } catch (err) {
        console.error('[AdRotationBanner] Error tracking impression:', err)
      }
    }

    trackImpression()
  }, [currentAdIndex, ads, supabase, pageType, sessionId])

  // Handle ad rotation timer
  useEffect(() => {
    if (ads.length === 0) return

    const rotationTimer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length)
    }, rotationIntervalSeconds * 1000)

    return () => clearInterval(rotationTimer)
  }, [ads, rotationIntervalSeconds])

  // Handle ad click
  const handleAdClick = async (ad: Ad) => {
    try {
      // Track click
      await supabase.from('ad_clicks').insert({
        ad_id: ad.id,
        page_type: pageType,
        user_session_id: sessionId
      })

      // Update click count
      await supabase
        .from('advertisements')
        .update({ clicks: (ad.clicks || 0) + 1 })
        .eq('id', ad.id)

      // Open the link
      window.open(ad.click_url, '_blank')
    } catch (err) {
      console.error('[AdRotationBanner] Error tracking click:', err)
      // Still open the link even if tracking fails
      window.open(ad.click_url, '_blank')
    }
  }

  // Don't render anything during loading or if no ads found
  if (ads.length === 0) {
    // Don't show placeholder - just return null to avoid blank space
    if (isLoading) {
      return null
    }
    console.warn('[AdRotationBanner] No active advertisements found for pageType:', pageType)
    return null
  }

  const currentAd = ads[currentAdIndex]
  if (!currentAd) {
    console.warn('[AdRotationBanner] Current ad not found at index:', currentAdIndex)
    return null
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => handleAdClick(currentAd)}
          className="w-full relative block overflow-hidden rounded-lg group cursor-pointer transition"
          style={{ height: `${currentAd.banner_height}px` }}
          title={currentAd.title}
        >
          {/* Ad Image/Content */}
          <img
            src={currentAd.banner_image_url}
            alt={currentAd.alt_text || currentAd.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition"
          />

          {/* Optional: Dark overlay to ensure readability */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition" />

          {/* Ad indicator dots - shows which ad is currently displayed */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {ads.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  index === currentAdIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Sponsored label */}
          <div className="absolute top-2 right-3 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
            Sponsored
          </div>
        </button>
      </div>
    </div>
  )
}

export default AdRotationBanner
