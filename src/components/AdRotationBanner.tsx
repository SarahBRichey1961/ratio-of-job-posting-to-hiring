import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Ad {
  id: string
  title: string
  description: string
  banner_image_url: string
  banner_height: number
  click_url: string
  alt_text: string
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  // Fetch active ads on mount
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('advertisements')
          .select('id, title, description, banner_image_url, banner_height, click_url, alt_text')
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order('created_at', { ascending: false })
          .limit(maxAds)

        if (error) {
          console.error('Error fetching ads:', error)
          setAds([])
        } else {
          setAds(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch ads:', err)
        setAds([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAds()
  }, [])

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
  }, [currentAdIndex, ads])

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
  if (isLoading || ads.length === 0) {
    return null
  }

  const currentAd = ads[currentAdIndex]
  if (!currentAd) return null

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
