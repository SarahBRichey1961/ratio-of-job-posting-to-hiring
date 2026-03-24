declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: { token: string }) => void
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void
      }
    }
  }
}

interface PaddleCheckoutOptions {
  items: PaddleCheckoutItem[]
  customData?: Record<string, any>
  successUrl?: string
  cancelUrl?: string
}

interface PaddleCheckoutItem {
  priceId: string
  quantity: number
}

export {}
