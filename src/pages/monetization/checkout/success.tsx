import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function CheckoutSuccess() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!router.isReady) return

    const { token, subscription_id, planType, userType } = router.query as Record<string, string>

    const process = async () => {
      if (planType === 'onetime' && token) {
        // Capture the PayPal order
        try {
          const res = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: token }),
          })

          if (res.ok) {
            setStatus('success')
            setMessage('Payment confirmed! Your account has been activated.')
          } else {
            setStatus('error')
            setMessage('Payment could not be confirmed. Please contact support.')
          }
        } catch {
          setStatus('error')
          setMessage('An error occurred confirming your payment. Please contact support.')
        }
      } else if (subscription_id) {
        // Subscription activated — webhook will handle the DB update
        setStatus('success')
        setMessage('Subscription activated! Your account is now live.')
      } else {
        setStatus('success')
        setMessage('Thank you! Your payment has been received.')
      }
    }

    process()
  }, [router.isReady, router.query])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <Head>
        <title>Checkout Complete — Take The Reins</title>
      </Head>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">Confirming your payment…</h1>
            <p className="text-slate-400">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-white mb-3">All set!</h1>
            <p className="text-slate-400 mb-8">{message}</p>
            <Link
              href="/hub"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-slate-400 mb-8">{message}</p>
            <div className="space-y-3">
              <Link
                href="/hub"
                className="block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/monetization/pricing"
                className="block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Back to Pricing
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
