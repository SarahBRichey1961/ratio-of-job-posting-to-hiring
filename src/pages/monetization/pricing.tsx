import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'

// PayPal SDK Types
declare global {
  var paypal: any
}

export default function PricingPage() {
  const { session, isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalError, setPaypalError] = useState('')

  // Build the PayPal SDK URL - declare early so useEffect can access it
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const paypalSdkUrl = clientId 
    ? `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons&disable-funding=credit,paylater`
    : null

  if (!clientId) {
    return (
      <div className="min-h-screen bg-red-900/20 flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-600 rounded p-6 max-w-md">
          <h1 className="text-red-300 font-bold mb-2">Configuration Error</h1>
          <p className="text-red-200">PayPal Client ID is not configured. Please contact support.</p>
        </div>
      </div>
    )
  }

  // Load PayPal SDK - use direct script injection (proven working method)
  useEffect(() => {
    // Don't load if already loaded
    if (typeof window !== 'undefined' && !window.paypal) {
      console.log(`[PAYPAL_SCRIPT] Injecting PayPal SDK script directly...`)
      
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons&disable-funding=credit,paylater`
      script.async = true
      
      script.onload = () => {
        console.log(`[PAYPAL_SCRIPT] Script onload fired`)
        handlePayPalScriptLoad()
      }
      
      script.onerror = (error) => {
        console.error(`[PAYPAL_SCRIPT] Script onerror fired:`, error)
        handlePayPalScriptError(error)
      }
      
      // Add to head instead of body for faster loading
      document.head.appendChild(script)
      console.log(`[PAYPAL_SCRIPT] Script appended to document.head`)
    } else if (window.paypal) {
      console.log(`[PAYPAL_SCRIPT] window.paypal already exists`)
      handlePayPalScriptLoad()
    }
  }, [clientId])

  // Handle PayPal SDK load success - with deeper diagnostics
  const handlePayPalScriptLoad = () => {
    console.log(`[PAYPAL_SCRIPT] Next.js Script onLoad fired, checking PayPal SDK...`)
    console.log(`[PAYPAL_SCRIPT] Client ID: ${clientId}`)
    console.log(`[PAYPAL_SCRIPT] SDK URL: ${paypalSdkUrl}`)
    
    // Check for any errors that might have been thrown
    try {
      // Force a check for window.paypal in a different way
      const hasPaypal = 'paypal' in window
      const paypalType = typeof (window as any).paypal
      console.log(`[PAYPAL_SCRIPT] window.paypal exists (hasOwnProperty): ${hasPaypal}`)
      console.log(`[PAYPAL_SCRIPT] window.paypal type: ${paypalType}`)
      console.log(`[PAYPAL_SCRIPT] window keys with 'pay': ${Object.keys(window).filter(k => k.toLowerCase().includes('pay'))}`)
    } catch (e) {
      console.error(`[PAYPAL_SCRIPT] Error checking window.paypal:`, e)
    }
    
    // Verify script tag is actually in the DOM
    const scriptTag = document.querySelector(`script[src*="paypal.com/sdk"]`)
    if (!scriptTag) {
      console.error(`[PAYPAL_SCRIPT] Script tag not found in DOM after onLoad!`)
      setPaypalError('PayPal SDK script failed to load from network.')
      // Still attempt polling in case it loads later
    } else {
      console.log(`[PAYPAL_SCRIPT] Script tag found in DOM: ${scriptTag.getAttribute('src')}`)
    }
    
    console.log(`[PAYPAL_SCRIPT] window.paypal exists: ${typeof window.paypal !== 'undefined'}`)
    
    // PayPal SDK might not be immediately available due to storage blocking or network delay
    // Use aggressive polling to wait for initialization
    let attempts = 0
    const maxAttempts = 200 // Try for up to 10 seconds (200 * 50ms)
    let hardTimeoutReached = false
    
    // Hard timeout: After 5 seconds, show fallback regardless
    const hardTimeout = setTimeout(() => {
      hardTimeoutReached = true
      if (!paypalLoaded) {
        console.warn(`[PAYPAL_SCRIPT] Hard timeout (5s) reached, showing fallback`)
        setPaypalError('PayPal SDK is taking too long to load. Using fallback payment option.')
      }
    }, 5000)
    
    const checkPayPal = () => {
      attempts++
      
      // Check if PayPal SDK is fully initialized
      if (window.paypal && window.paypal.Buttons) {
        console.log(`[PAYPAL_SCRIPT] ✅ window.paypal.Buttons available (attempt ${attempts}/${maxAttempts})`)
        clearTimeout(hardTimeout)
        setPaypalLoaded(true)
        setPaypalError('')
        return
      }
      
      // Log state at certain intervals for debugging
      if (attempts === 1 || attempts === 5 || attempts === 10 || attempts % 20 === 0) {
        const paypalExists = typeof window.paypal !== 'undefined'
        const buttonsExists = window.paypal?.Buttons ? 'yes' : 'no'
        const scriptLoaded = !!document.querySelector(`script[src*="paypal.com/sdk"]`)
        console.log(`[PAYPAL_SCRIPT] Attempt ${attempts}: script=${scriptLoaded}, window.paypal=${paypalExists}, Buttons=${buttonsExists}`)
      }
      
      if (attempts >= maxAttempts) {
        console.error(`[PAYPAL_SCRIPT] ❌ PayPal not initialized after ${attempts} attempts`)
        console.error(`[PAYPAL_SCRIPT] Final state: window.paypal=${typeof window.paypal !== 'undefined'}, Buttons=${window.paypal?.Buttons ? 'yes' : 'no'}`)
        clearTimeout(hardTimeout)
        
        // Check if script ever loaded
        const scriptInDom = !!document.querySelector(`script[src*="paypal.com/sdk"]`)
        
        // Determine error cause
        let errorMsg = ''
        if (!scriptInDom) {
          errorMsg = 'PayPal SDK script failed to load from CDN. This is usually due to network blocking or browser tracking protection.'
        } else if (typeof window.paypal === 'undefined') {
          errorMsg = 'PayPal SDK script loaded but did not initialize. Your browser may be blocking localStorage or cookies.'
        } else if (!window.paypal.Buttons) {
          errorMsg = 'PayPal SDK loaded but Buttons component is not available. Your browser may be blocking it.'
        } else {
          errorMsg = 'PayPal SDK initialization failed. Please refresh the page.'
        }
        
        setPaypalError(errorMsg)
        console.warn(`[PAYPAL_SCRIPT] Fallback payment option will be shown with "Continue to PayPal Payment" button`)
        return
      }
      
      // Retry after 50ms, but stop if hard timeout reached
      if (!hardTimeoutReached) {
        setTimeout(checkPayPal, 50)
      }
    }
    
    checkPayPal()
  }

  const handlePayPalScriptError = (error: any) => {
    console.error(`[PAYPAL_SCRIPT] Script load error:`, error)
    console.error(`[PAYPAL_SCRIPT] Error details:`, { message: error?.message, code: error?.code, type: error?.type })
    console.error(`[PAYPAL_SCRIPT] Error stack:`, error?.stack)
    setPaypalError(`Failed to load PayPal SDK: ${error?.message || 'Unknown error'}. Verify your PayPal credentials are valid.`)
    setLoading(null)
  }

  const createPayPalOrder = async (userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    if (!isAuthenticated) {
      router.push('/auth/signup')
      throw new Error('Not authenticated')
    }

    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    try {
      console.log(`[PRICING] Creating PayPal order: userType=${userType}, planType=${planType}`)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/paypal/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userType, planType }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        console.error(`[PRICING] Checkout failed: ${response.status} - ${data.error}`)
        if (response.status === 401) {
          throw new Error('Authentication failed. Please try logging in again.')
        }
        throw new Error(data.error || `Failed to create order (${response.status})`)
      }

      console.log(`[PRICING] Order created successfully: orderId=${data.id}`)
      return data.id // PayPal Order ID
    } catch (err: any) {
      console.error('[PRICING] Order creation error:', err)
      
      if (err.name === 'AbortError') {
        throw new Error('Payment request timed out. Please try again.')
      }
      throw err
    }
  }

  const handlePayPalApprove = async (orderData: any, userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    try {
      console.log(`[PRICING] Payment approved: orderId=${orderData.orderID}, userType=${userType}, planType=${planType}`)
      setLoading(`${userType}-${planType}`)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for capture

      // Capture the payment
      const response = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId: orderData.orderID }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok) {
        console.error(`[PRICING] Capture failed: ${response.status} - ${data.error}`)
        throw new Error(data.error || `Failed to capture payment (${response.status})`)
      }

      console.log(`[PRICING] Payment captured successfully, redirecting to success page`)
      // Redirect to success page
      router.push(`/monetization/checkout/success?userType=${userType}&planType=${planType}`)
    } catch (err: any) {
      console.error(`[PRICING] Error in payment approval:`, err)
      
      if (err.name === 'AbortError') {
        setError('Payment capture timed out. Please refresh and try again.')
      } else {
        setError((err as Error).message || 'Payment processing failed')
      }
      setLoading(null)
    }
  }

  const PayPalButton = ({
    userType,
    planType,
    price,
  }: {
    userType: 'sponsor' | 'advertiser'
    planType: 'monthly' | 'annual' | 'onetime'
    price: string
  }) => {
    const [renderError, setRenderError] = useState('')
    const [isRendering, setIsRendering] = useState(false)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    
    // Diagnostic logging
    useEffect(() => {
      console.log(`[PAYPAL_BUTTON] ${userType}-${planType} state: paypalLoaded=${paypalLoaded}, paypalError="${paypalError}"`)
    }, [paypalLoaded, paypalError, userType, planType])
    
    const handleDirectCheckout = async () => {
      try {
        setIsCheckingOut(true)
        
        // Add request timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch('/api/paypal/checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({ userType, planType }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`[CHECKOUT] Response error: ${response.status} ${response.statusText}`)
          const errorData = await response.json()
          throw new Error(errorData.error || `Payment initialization failed (${response.status})`)
        }
        
        const data = await response.json()
        
        if (data.approval_url) {
          // Redirect to PayPal's hosted checkout
          console.log('[CHECKOUT] Redirecting to PayPal approval URL')
          window.location.href = data.approval_url
        } else if (data.id) {
          // Fallback: redirect to PayPal manually
          console.warn('[CHECKOUT] No approval_url, using order ID to redirect')
          window.location.href = `https://www.${process.env.PAYPAL_MODE === 'sandbox' ? 'sandbox.' : ''}paypal.com/checkoutnow?token=${data.id}`
        } else {
          throw new Error('Failed to create checkout session - no approval URL returned')
        }
      } catch (error: any) {
        clearTimeout(undefined)
        console.error('[CHECKOUT] Error:', error)
        
        if (error.name === 'AbortError') {
          setRenderError('Payment request timed out. Please try again.')
        } else if (!session?.access_token) {
          setRenderError('Please sign in to continue with payment.')
        } else {
          setRenderError(`Payment initialization failed: ${error.message}`)
        }
      } finally {
        setIsCheckingOut(false)
      }
    }
    
    useEffect(() => {
      if (!paypalLoaded) {
        console.log(`[PAYPAL_BUTTON] Waiting for PayPal SDK to load for ${userType}-${planType}`)
        return
      }

      const container = document.getElementById(`paypal-button-${userType}-${planType}`)
      if (!container) {
        console.error(`[PAYPAL_BUTTON] Container not found for ${userType}-${planType}`)
        setRenderError('Payment button container not found')
        return
      }

      console.log(`[PAYPAL_BUTTON] Rendering PayPal buttons for ${userType}-${planType}`)
      setIsRendering(true)

      // Clear any existing buttons
      container.innerHTML = ''

      // Poll for window.paypal.Buttons with longer timeout
      let pollAttempts = 0
      const maxPollAttempts = 50 // 5 seconds with 100ms intervals
      
      const attemptRender = () => {
        pollAttempts++
        
        if (!window.paypal || !window.paypal.Buttons) {
          if (pollAttempts < maxPollAttempts) {
            console.log(`[PAYPAL_BUTTON] Waiting for window.paypal.Buttons (attempt ${pollAttempts}/${maxPollAttempts})`)
            setTimeout(attemptRender, 100)
            return
          } else {
            console.error(`[PAYPAL_BUTTON] window.paypal.Buttons not available after ${maxPollAttempts} attempts`)
            setRenderError('PayPal SDK not fully initialized. Try refreshing the page.')
            setIsRendering(false)
            return
          }
        }

        if (pollAttempts > 1) {
          console.log(`[PAYPAL_BUTTON] window.paypal.Buttons found on attempt ${pollAttempts}`)
        }

        try {
          console.log(`[PAYPAL_BUTTON] Creating Buttons object for ${userType}-${planType}`)
          window.paypal
            .Buttons({
              createOrder: async () => {
                try {
                  console.log(`[PAYPAL_BUTTON] Creating order for ${userType}-${planType}`)
                  const orderId = await createPayPalOrder(userType, planType)
                  console.log(`[PAYPAL_BUTTON] Order created: ${orderId}`)
                  return orderId
                } catch (err) {
                  console.error('[PAYPAL_BUTTON] Order creation failed:', err)
                  setRenderError(`Failed to create order: ${err instanceof Error ? err.message : String(err)}`)
                  throw err
                }
              },
              onApprove: async (data: any) => {
                try {
                  console.log(`[PAYPAL_BUTTON] Order approved, capturing payment...`)
                  await handlePayPalApprove(data, userType, planType)
                } catch (err) {
                  console.error(`[PAYPAL_BUTTON] Approval handler error:`, err)
                  setRenderError(`Payment processing error: ${err instanceof Error ? err.message : String(err)}`)
                }
              },
              onError: (err: any) => {
                console.error('[PAYPAL_BUTTON] PayPal error:', err)
                setRenderError(`Payment error: ${err?.message || err}. Please try again or use the fallback option.`)
              },
              onCancel: (data: any) => {
                console.log(`[PAYPAL_BUTTON] Payment cancelled`)
                setRenderError('')
              },
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
              },
            })
            .render(`#paypal-button-${userType}-${planType}`)
            .then(() => {
              console.log(`[PAYPAL_BUTTON] ✅ Buttons rendered successfully for ${userType}-${planType}`)
              setIsRendering(false)
              setRenderError('')
            })
            .catch((err: any) => {
              console.error(`[PAYPAL_BUTTON] Render error for ${userType}-${planType}:`, err)
              setRenderError(`Failed to render payment button: ${err instanceof Error ? err.message : String(err)}`)
              setIsRendering(false)
            })
        } catch (err) {
          console.error(`[PAYPAL_BUTTON] Error creating buttons:`, err)
          setRenderError(`Error setting up payment: ${err instanceof Error ? err.message : String(err)}`)
          setIsRendering(false)
        }
      }
      
      attemptRender()
    }, [paypalLoaded, userType, planType])

    // Show fallback if there's an error, regardless of loading state
    if (paypalError) {
      return (
        <div className="mt-4 space-y-3">
          <div className="bg-amber-900/40 border-2 border-amber-600/60 rounded-lg p-4 text-amber-100">
            <div className="font-bold mb-3 text-base flex items-center gap-2">
              <span>⚠️</span> Browser Blocking Payment
            </div>
            <div className="mb-4 text-sm leading-relaxed bg-amber-950/40 p-3 rounded border border-amber-700/30">
              {paypalError}
            </div>
            <div className="mb-4 text-xs space-y-2">
              <div className="font-semibold text-amber-300 mb-2">🔧 What You Can Do:</div>
              <div className="space-y-2 text-amber-200">
                <div>
                  <strong>Firefox Users:</strong> Click the shield icon 🛡️ in the address bar → "Disable protection on this site" → Refresh page
                </div>
                <div>
                  <strong>Safari Users:</strong> Menu → Preferences → Privacy tab → Uncheck "Prevent cross-site tracking" → Refresh
                </div>
                <div>
                  <strong>Chrome/Edge Users:</strong> Try Incognito mode (Ctrl+Shift+N) or clear your browser cache
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={handleDirectCheckout}
                disabled={isCheckingOut}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg text-base transition"
              >
                {isCheckingOut ? '⏳ Processing...' : '💳 Continue to PayPal Payment'}
              </button>
            </div>
            <a 
              href="mailto:support@take-the-reins.ai?subject=Payment%20Help&body=I'm%20having%20trouble%20with%20PayPal%20payment%20on%20the%20pricing%20page.%20Browser:%20[INSERT]" 
              className="block mt-3 text-center text-amber-400 hover:text-amber-300 underline text-xs transition"
            >
              💬 Still having issues? Contact support
            </a>
          </div>
        </div>
      )
    }
    
    if (!paypalLoaded) {
      return (
        <div className="mt-4 space-y-3">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center text-slate-400 text-sm animate-pulse">
            ⏳ Loading payment options...
          </div>
        </div>
      )
    }

    return (
      <>
        {isRendering && (
          <div className="mt-4 bg-slate-700/50 rounded-lg p-4 text-center text-slate-400 text-sm">
            Initializing payment button...
          </div>
        )}
        <div
          id={`paypal-button-${userType}-${planType}`}
          className="mt-4"
          style={{ minHeight: '60px' }}
        />
        {renderError && (
          <p className="text-red-400 text-sm mt-2">{renderError}</p>
        )}
      </>
    )
  }

  const PricingCard = ({
    title,
    description,
    monthly,
    annual,
    onetime,
    features,
    userType,
    planTypes,
  }: {
    title: string
    description: string
    monthly: number
    annual: number
    onetime: number
    features: string[]
    userType: 'sponsor' | 'advertiser'
    planTypes: ('monthly' | 'annual' | 'onetime')[]
  }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 hover:border-indigo-500/50 transition">
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-6">{description}</p>

      <div className="space-y-6 mb-8">
        {/* Monthly */}
        {planTypes.includes('monthly') && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-semibold">Monthly</span>
              <span className="text-2xl font-bold text-indigo-400">${monthly}/mo</span>
            </div>
            {!isAuthenticated ? (
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Sign Up to Continue
              </button>
            ) : (
              <PayPalButton userType={userType} planType="monthly" price={monthly.toString()} />
            )}
          </div>
        )}

        {/* Annual */}
        {planTypes.includes('annual') && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-green-600/30">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-white font-semibold">Annual</span>
                <span className="text-green-400 text-xs ml-2">(Save ~$387)</span>
              </div>
              <span className="text-2xl font-bold text-green-400">${annual}/yr</span>
            </div>
            {!isAuthenticated ? (
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Sign Up to Continue
              </button>
            ) : (
              <PayPalButton userType={userType} planType="annual" price={annual.toString()} />
            )}
          </div>
        )}

        {/* One-Time */}
        {planTypes.includes('onetime') && (
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-semibold">One-Time</span>
              <span className="text-2xl font-bold text-slate-300">${onetime}</span>
            </div>
            {!isAuthenticated ? (
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Sign Up to Continue
              </button>
            ) : (
              <PayPalButton userType={userType} planType="onetime" price={onetime.toString()} />
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wide">Includes:</p>
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-indigo-400 mt-1">✓</span>
            <span className="text-slate-300">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Pricing - Take The Reins</title>
        <meta name="description" content="Sponsor or advertise on Take The Reins" />
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-white font-bold text-lg hover:text-indigo-400 transition">
            Take The Reins
          </Link>
          <div className="space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login" className="text-slate-300 hover:text-white transition">
                  Login
                </Link>
                <Link href="/auth/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/hub" className="text-slate-300 hover:text-white transition">
                Back to Hub
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400">
            Support the platform or showcase your business to our community
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-600/20 border border-red-600/50 text-red-200 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {paypalError && (
          <div className="mb-8 bg-red-900/30 border-2 border-red-600/70 text-red-200 px-6 py-4 rounded-lg">
            <div className="font-bold mb-2 text-lg flex items-center gap-2">
              <span>⚠️</span> Payment System Notice
            </div>
            <div className="mb-3 text-sm">{paypalError}</div>
            <div className="text-xs bg-red-900/20 p-4 rounded-lg mt-3 border border-red-700/30 space-y-2">
              <strong className="block text-red-300 mb-2">✅ How to Fix:</strong>
              <div className="text-red-100 space-y-1">
                <div><strong>Firefox Users:</strong> Click the shield 🛡️ next to the URL → "Disable protection on this site" → Refresh page</div>
                <div><strong>Safari Users:</strong> Menu (top-left) → Preferences → Privacy tab → Uncheck "Prevent cross-site tracking" → Refresh</div>
                <div><strong>Chrome Users:</strong> Try Incognito mode (Ctrl+Shift+N), or use the button below</div>
              </div>
              <div className="text-red-300 mt-3 font-semibold">
                ℹ️ The "Pay with PayPal" button below will work regardless of browser settings
              </div>
            </div>
          </div>
        )}

        {!paypalLoaded && !paypalError && (
          <div className="mb-8 bg-indigo-600/20 border border-indigo-600/50 text-indigo-200 px-6 py-4 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full"></div>
            <span>Loading payment options...</span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <PricingCard
            title="Sponsor Membership"
            description="Support Take The Reins and get recognition as a platform sponsor"
            monthly={199}
            annual={1999}
            onetime={499}
            features={[
              'Your company logo displayed on the platform',
              'Sponsor badge on your profile',
              'Priority support',
              'Monthly feature highlights',
              'Analytics dashboard',
            ]}
            userType="sponsor"
            planTypes={['onetime']}
          />

          <PricingCard
            title="Advertiser Account"
            description="Showcase your business with rotating banner ads across the platform"
            monthly={199}
            annual={1999}
            onetime={499}
            features={[
              'Up to 5 active ads at any time',
              'Ads displayed on Dashboard, Comparison, and Hub pages',
              '2-minute rotation cycles',
              'Real-time analytics (impressions, clicks, CTR)',
              'Full ad management dashboard',
            ]}
            userType="advertiser"
            planTypes={['monthly', 'annual']}
          />
        </div>

        {/* FAQ Section */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400">Yes! Monthly and annual subscriptions can be cancelled anytime. One-time payments are non-refundable but provide permanent access.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do I need to be a sponsor to advertise?</h3>
              <p className="text-slate-400">No, they are completely separate offerings. You can choose to be a sponsor, an advertiser, both, or neither.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-400">We accept all major credit and debit cards plus PayPal balance, processed securely through PayPal. Your payment information is never stored on our servers.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What if I exceed the ad limit?</h3>
              <p className="text-slate-400">Advertisers are limited to 5 active ads. If you reach the limit, you can delete or deactivate existing ads to create new ones.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a setup fee?</h3>
              <p className="text-slate-400">No, there are no hidden fees or setup charges. You only pay the advertised price.</p>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">
            Have questions? Contact us at <a href="mailto:support@takethereins.com" className="text-indigo-400 hover:text-indigo-300">support@takethereins.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
