declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: 'sandbox' | 'production') => void
      }
      Initialize: (config: { token: string; eventCallback?: (event: PaddleEvent) => void }) => void
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void
      }
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?: string
      NEXT_PUBLIC_PADDLE_SPONSOR_MONTHLY_PRICE_ID?: string
      NEXT_PUBLIC_PADDLE_SPONSOR_ANNUAL_PRICE_ID?: string
      NEXT_PUBLIC_PADDLE_SPONSOR_ONETIME_PRICE_ID?: string
      NEXT_PUBLIC_PADDLE_ADVERTISER_MONTHLY_PRICE_ID?: string
      NEXT_PUBLIC_PADDLE_ADVERTISER_ANNUAL_PRICE_ID?: string
      NEXT_PUBLIC_PADDLE_ADVERTISER_ONETIME_PRICE_ID?: string
    }
  }
}

interface PaddleEvent {
  name: string
  data?: Record<string, unknown>
}

interface PaddleCheckoutOptions {
  items: PaddleCheckoutItem[]
  customData?: Record<string, any>
  successUrl?: string
  cancelUrl?: string
  eventCallback?: (event: PaddleEvent) => void
}

interface PaddleCheckoutItem {
  priceId: string
  quantity: number
}

export {}
