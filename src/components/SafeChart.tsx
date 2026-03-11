import React, { useState, ReactNode } from 'react'
import { Card } from '@/components/DashboardUI'

interface SafeChartProps {
  children: ReactNode
  title?: string
  fallbackMessage?: string
}

export function SafeChart({ children, title, fallbackMessage = 'Chart failed to render' }: SafeChartProps) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <Card className="bg-yellow-900 border-yellow-700">
        <div>
          {title && <h4 className="text-yellow-200 font-semibold mb-2">{title}</h4>}
          <p className="text-yellow-300 text-sm">{fallbackMessage}</p>
          <p className="text-yellow-400 text-xs mt-2">Error: {error}</p>
        </div>
      </Card>
    )
  }

  try {
    return <>{children}</>
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`SafeChart[${title}] rendering error:`, errorMsg)
    setError(errorMsg)
    return (
      <Card className="bg-yellow-900 border-yellow-700">
        <div>
          {title && <h4 className="text-yellow-200 font-semibold mb-2">{title}</h4>}
          <p className="text-yellow-300 text-sm">{fallbackMessage}</p>
          <p className="text-yellow-400 text-xs mt-2">Error: {errorMsg}</p>
        </div>
      </Card>
    )
  }
}

export class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🔴 ErrorBoundary caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component stack:', errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-red-900 border-red-700">
          <div>
            <h4 className="text-red-200 font-semibold mb-2">Rendering Error</h4>
            <p className="text-red-300 text-sm">
              {this.state.error?.message || 'An error occurred while rendering'}
            </p>
            <details className="text-red-400 text-xs mt-3">
              <summary>Details</summary>
              <pre className="mt-2 bg-red-950 p-2 rounded text-wrap">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}
