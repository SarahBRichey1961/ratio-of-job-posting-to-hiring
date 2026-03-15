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
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))

  // Use singleton browser client instead of creating a new one
  const supabase = useMemo(() => getSupabase(), [])

  // Fetch active ads on mount with retry logic for auth locks
  useEffect(() => {
    let retries = 0
    const maxRetries = 3
    const fetchAdsWithRetry = async () => {
      try {
        setIsLoading(true)
        const now = new Date().toISOString()
        
        // Fetch all active ads
        const { data, error } = await supabase
          .from('advertisements')
          .select('id, title, description, banner_image_url, banner_height, click_url, alt_text, impressions, clicks, is_active, expires_at, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(maxAds)

        if (error) {
          // Check if it's a lock timeout error
          if (error.message?.includes('LockManager') && retries < maxRetries) {
            console.warn(`[AdRotationBanner] Lock timeout, retrying (attempt ${retries + 1}/${maxRetries})...`)
            retries++
            // Wait and retry
            setTimeout(fetchAdsWithRetry, 1000 * (retries + 1))
            return
          }
          console.error('[AdRotationBanner] Error fetching ads:', error)
          setAds([])
        } else {
          // Filter expired ads client-side
          const activeAds = (data || []).filter(ad => 
            !ad.expires_at || new Date(ad.expires_at) > new Date(now)
          )
          console.log(`[AdRotationBanner] Fetched ${data?.length || 0} ads, ${activeAds.length} are active and not expired`)
          setAds(activeAds)
        }
      } catch (err) {
        // Check if it's a lock timeout error
        if (err instanceof Error && err.message?.includes('LockManager') && retries < maxRetries) {
          console.warn(`[AdRotationBanner] Lock timeout, retrying (attempt ${retries + 1}/${maxRetries})...`)
          retries++
          // Wait and retry
          setTimeout(fetchAdsWithRetry, 1000 * (retries + 1))
          return
        }
        console.error('[AdRotationBanner] Failed to fetch ads:', err)
        setAds([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdsWithRetry()
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
        console.error('Error tracking impression:', err)
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
      console.error('Error tracking click:', err)
      // Still open the link even if tracking fails
      window.open(ad.click_url, '_blank')
    }
  }

  // Don't render if no ads or still loading
  if (isLoading) {
    return null
  }

  if (ads.length === 0) {
    // Log for debugging
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
