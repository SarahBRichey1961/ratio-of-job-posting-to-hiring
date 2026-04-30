import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Script from 'next/script'
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

  // Handle PayPal SDK load success
  const handlePayPalScriptLoad = () => {
    console.log(`[PAYPAL_SCRIPT] Next.js Script onLoad fired`)
    
    // PayPal SDK might not be immediately available due to storage blocking
    // Use aggressive polling to wait for initialization
    let attempts = 0
    const maxAttempts = 50 // Try for up to 2.5 seconds (50 * 50ms)
    
    const checkPayPal = () => {
      attempts++
      
      if (window.paypal && window.paypal.Buttons) {
        console.log(`[PAYPAL_SCRIPT] ✅ window.paypal.Buttons available (attempt ${attempts})`)
        setPaypalLoaded(true)
        setPaypalError('')
        return
      }
      
      if (attempts >= maxAttempts) {
        console.error(`[PAYPAL_SCRIPT] PayPal not initialized after ${attempts} attempts`)
        setPaypalError('PayPal SDK could not initialize. This is usually caused by Enhanced Tracking Protection in Firefox. You can: 1) Disable tracking protection for this site, or 2) Contact us for alternative payment methods.')
        return
      }
      
      if (attempts === 1) {
        console.warn(`[PAYPAL_SCRIPT] window.paypal.Buttons not available, polling...`)
      }
      
      // Retry after 50ms
      setTimeout(checkPayPal, 50)
    }
    
    checkPayPal()
  }

  const handlePayPalScriptError = (error: any) => {
    console.error(`[PAYPAL_SCRIPT] Script load error:`, error)
    setPaypalError(`Failed to load PayPal SDK: ${error?.message || 'Unknown error'}`)
    setLoading(null)
  }

  // Build the PayPal SDK URL
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const paypalSdkUrl = clientId 
    ? `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons`
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

  const createPayPalOrder = async (userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    if (!isAuthenticated) {
      router.push('/auth/signup')
      throw new Error('Not authenticated')
    }

    try {
      console.log(`[PRICING] Creating PayPal order: userType=${userType}, planType=${planType}`)
      const response = await fetch('/api/paypal/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ userType, planType }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[PRICING] Checkout failed: ${data.error}`)
        throw new Error(data.error || 'Failed to create order')
      }

      console.log(`[PRICING] Order created successfully: orderId=${data.id}`)
      return data.id // PayPal Order ID
    } catch (err) {
      console.error(`[PRICING] Error creating order:`, err)
      setError((err as Error).message)
      throw err
    }
  }

  const handlePayPalApprove = async (orderData: any, userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    try {
      console.log(`[PRICING] Payment approved: orderId=${orderData.orderID}, userType=${userType}, planType=${planType}`)
      setLoading(`${userType}-${planType}`)

      // Capture the payment
      const response = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ orderId: orderData.orderID }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`[PRICING] Capture failed: ${data.error}`)
        throw new Error(data.error || 'Failed to capture payment')
      }

      console.log(`[PRICING] Payment captured successfully, redirecting to success page`)
      // Redirect to success page
      router.push(`/monetization/checkout/success?userType=${userType}&planType=${planType}`)
    } catch (err) {
      console.error(`[PRICING] Error in payment approval:`, err)
      setError((err as Error).message)
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
    
    const handleDirectCheckout = async () => {
      try {
        setIsCheckingOut(true)
        const response = await fetch('/api/paypal/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType, planType }),
        })
        const data = await response.json()
        
        if (data.approval_url) {
          // Redirect to PayPal's hosted checkout
          window.location.href = data.approval_url
        } else {
          setRenderError('Failed to create checkout session')
        }
      } catch (error) {
        console.error('Checkout error:', error)
        setRenderError('Payment initialization failed')
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

      // Poll for window.paypal.Buttons since it might not be immediately available
      let pollAttempts = 0
      const maxPollAttempts = 20
      
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
                setRenderError(`PayPal error: ${err.message || err}`)
                setError(err.message || 'Payment failed')
              },
              style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'pay',
              },
            })
            .render(`#paypal-button-${userType}-${planType}`)
            .catch((err: any) => {
              console.error(`[PAYPAL_BUTTON] Failed to render buttons: ${err}`)
              setRenderError(`Failed to render button: ${err instanceof Error ? err.message : String(err)}`)
              setIsRendering(false)
            })
          
          setIsRendering(false)
        } catch (err) {
          console.error(`[PAYPAL_BUTTON] Error creating buttons:`, err)
          setRenderError(`Error setting up payment: ${err instanceof Error ? err.message : String(err)}`)
          setIsRendering(false)
        }
      }
      
      attemptRender()
    }, [paypalLoaded, userType, planType])

    if (!paypalLoaded) {
      return (
        <div className="mt-4 space-y-3">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center text-slate-400 text-sm">
            Loading payment options...
          </div>
          {paypalError && (
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-amber-200 text-xs">
              <div className="font-semibold mb-2">Payment Option Unavailable</div>
              <div className="mb-2">{paypalError}</div>
              <div className="text-amber-300 mb-3">
                <strong>Try these options:</strong>
                <ul className="list-disc ml-4 mt-1 text-amber-300">
                  <li>In Firefox: Click the shield icon → disable Enhanced Tracking Protection → refresh</li>
                  <li>Or use the button below to pay directly through PayPal</li>
                </ul>
              </div>
              <button
                onClick={handleDirectCheckout}
                disabled={isCheckingOut}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded text-sm transition"
              >
                {isCheckingOut ? 'Processing...' : 'Pay with PayPal'}
              </button>
              <a 
                href="mailto:support@takethereins.com?subject=Payment%20Help" 
                className="inline-block mt-2 text-amber-400 hover:text-amber-300 underline text-xs"
              >
                Or contact support for help
              </a>
            </div>
          )}
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

      {/* Load PayPal SDK using Next.js Script component */}
      {paypalSdkUrl && (
        <Script
          src={paypalSdkUrl}
          strategy="afterInteractive"
          onLoad={handlePayPalScriptLoad}
          onError={handlePayPalScriptError}
          data-namespace="paypal_sdk"
        />
      )}

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
          <div className="mb-8 bg-orange-600/20 border border-orange-600/50 text-orange-200 px-6 py-4 rounded-lg">
            <div className="font-semibold mb-1">PayPal Loading Issue:</div>
            <div>{paypalError}</div>
            <div className="text-xs mt-2 text-orange-300">Try refreshing the page. If the problem persists, disable browser tracking protection.</div>
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
