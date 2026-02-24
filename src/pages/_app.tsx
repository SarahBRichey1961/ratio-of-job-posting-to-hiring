import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { AuthProvider } from '@/context/AuthContext'

// Error boundary component to catch and handle errors gracefully
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: '20px', color: 'red' }}>
      <h1>Application Error</h1>
      <p>{error.message}</p>
      {error.message.includes('Navigator LockManager') && (
        <p>Storage synchronization error. Try refreshing the page or clearing browser cache.</p>
      )}
      <button onClick={() => window.location.reload()}>Reload Application</button>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Global error handler for uncaught errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error)
      if (event.error?.message?.includes('Navigator LockManager') || 
          event.error?.message?.includes('timed out')) {
        // Don't set error state for lock timeout, just log it
        console.warn('Lock timeout error - ignoring:', event.error.message)
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    return <ErrorFallback error={error} />
  }

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
