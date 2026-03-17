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
  const [fetchAttempt, setFetchAttempt] = useState(0)

  // Use singleton browser client with proper error handling
  const supabase = useMemo(() => getSupabase(), [])

  // Fetch active ads on mount using singleton client with timeout fallback
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const fetchAds = async (attempt: number = 0) => {
      if (!isMounted) return

      try {
        setIsLoading(true)
        console.log(`[AdRotationBanner] Starting ad fetch (attempt ${attempt + 1})...`)
        
        // Progressive delay: 2000ms on first attempt, 1500ms on retry (db might be settling)
        const delay = attempt === 0 ? 2000 : 1500
        await new Promise(resolve => setTimeout(resolve, delay))
        
        if (!isMounted) return
        
        const now = new Date().toISOString()
        
        // Fetch all active ads with 5-second timeout
        const fetchPromise = supabase
          .from('advertisements')
          .select('id, title, description, banner_image_url, banner_height, click_url, alt_text, impressions, clicks, is_active, expires_at, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(maxAds)

        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Ad fetch timeout after 5 seconds')), 5000)
        )

        const { data, error } = await Promise.race([
          fetchPromise,
          timeoutPromise as any
        ]) as any

        if (!isMounted) return

        if (error) {
          console.error(`[AdRotationBanner] Error fetching ads (attempt ${attempt + 1}):`, error)
          if (attempt < 1) {
            // Retry once on error
            console.log('[AdRotationBanner] Retrying ad fetch...')
            setFetchAttempt(attempt + 1)
            await fetchAds(attempt + 1)
          } else {
            setAds([])
            setIsLoading(false)
          }
        } else {
          // Filter expired ads client-side
          const activeAds = (data || []).filter(ad => 
            !ad.expires_at || new Date(ad.expires_at) > new Date(now)
          )
          console.log(`[AdRotationBanner] ✅ Fetched ${data?.length || 0} ads, ${activeAds.length} are active and not expired`)
          setAds(activeAds)
          setIsLoading(false)
        }
      } catch (err) {
        if (!isMounted) return
        
        console.error(`[AdRotationBanner] Failed to fetch ads (attempt ${attempt + 1}):`, err)
        
        // Retry once on timeout or network error
        if (attempt < 1) {
          console.log('[AdRotationBanner] ⚠️ Retrying ad fetch after failure...')
          setFetchAttempt(attempt + 1)
          await fetchAds(attempt + 1)
        } else {
          console.error('[AdRotationBanner] ❌ Ad fetch failed after 2 attempts, showing fallback (no ads)')
          setAds([])
          setIsLoading(false)
        }
      }
    }

    fetchAds(0)

    // Cleanup on unmount
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase, pageType, maxAds])

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

  // Don't render if no ads and not loading - show minimal placeholder on load attempt
  if (ads.length === 0) {
    if (isLoading) {
      // Show subtle loading placeholder during initial fetch
      return (
        <div className="w-full bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-32 bg-slate-700/50 rounded-lg" />
          </div>
        </div>
      )
    }
    // Log for debugging
    console.warn('[AdRotationBanner] No active advertisements found for pageType:', pageType)
    return null

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
