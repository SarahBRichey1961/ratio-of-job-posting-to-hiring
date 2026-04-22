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

  // Load PayPal SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.paypal) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`
      script.async = true
      script.onload = () => setPaypalLoaded(true)
      document.body.appendChild(script)
    } else if (window.paypal) {
      setPaypalLoaded(true)
    }
  }, [])

  const createPayPalOrder = async (userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    if (!isAuthenticated) {
      router.push('/auth/signup')
      throw new Error('Not authenticated')
    }

    try {
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
        throw new Error(data.error || 'Failed to create order')
      }

      return data.id // PayPal Order ID
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const handlePayPalApprove = async (orderData: any, userType: 'sponsor' | 'advertiser', planType: 'monthly' | 'annual' | 'onetime') => {
    try {
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
        throw new Error(data.error || 'Failed to capture payment')
      }

      // Redirect to success page
      router.push(`/monetization/checkout/success?userType=${userType}&planType=${planType}`)
    } catch (err) {
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
    useEffect(() => {
      if (!paypalLoaded) return

      const container = document.getElementById(`paypal-button-${userType}-${planType}`)
      if (!container) return

      // Clear any existing buttons
      container.innerHTML = ''

      window.paypal
        .Buttons({
          createOrder: async () => {
            try {
              const orderId = await createPayPalOrder(userType, planType)
              return orderId
            } catch (err) {
              console.error('Order creation failed:', err)
              throw err
            }
          },
          onApprove: async (data: any) => {
            await handlePayPalApprove(data, userType, planType)
          },
          onError: (err: any) => {
            console.error('PayPal error:', err)
            setError(err.message || 'Payment failed')
          },
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          },
        })
        .render(`#paypal-button-${userType}-${planType}`)
    }, [paypalLoaded, userType, planType])

    return (
      <div
        id={`paypal-button-${userType}-${planType}`}
        className="mt-4"
        style={{ minHeight: '60px' }}
      />
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
