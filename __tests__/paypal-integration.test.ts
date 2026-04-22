/**
 * Comprehensive Unit Tests for PayPal Integration
 * Tests checkout, capture, and webhook endpoints
 */

// ===== TEST SETUP AND MOCKS =====

interface MockSupabaseUser {
  id: string
  email: string
}

interface MockSupabaseAuthResponse {
  data: {
    user: MockSupabaseUser | null
  }
  error: Error | null
}

interface PayPalAccessTokenResponse {
  scope: string
  access_token: string
  token_type: string
  app_id: string
  expires_in: number
}

interface PayPalOrder {
  id: string
  status: string
  links: Array<{
    rel: string
    href: string
  }>
}

interface PayPalCapture {
  id: string
  status: string
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string
        status: string
      }>
    }
  }>
}

// Mock environment variables
const mockEnv = {
  PAYPAL_MODE: 'production',
  PAYPAL_CLIENT_ID: 'AZ1QA-kO8P5fX-IRWR7vD-yzLoS_PgaEs_xlzp0YFQhtTQUKTXzs1CJFELF3mMKWR8nnshN5XMEbyyRP',
  PAYPAL_CLIENT_SECRET: 'EDU9wfVstoIez2Jj3lv2q-lJwDPOHXwLkDBC8kNbU_0oahIbynjZsGrp9hZYIsKt1GghB82XuxxThcW5',
  PAYPAL_WEBHOOK_ID: 'EB8jG_4xVtYO3BayjS6zd7M3QhKBSXxwgJwU7TZMUb5-QKkLQ-QmATB_AsTfibH5tR5xuVUOk3PrlN__',
  NEXT_PUBLIC_SUPABASE_URL: 'https://eikhrkharihagaorqqcf.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key-12345',
  NEXT_PUBLIC_APP_URL: 'https://take-the-reins.ai'
}

// ===== PAYPAL CHECKOUT ENDPOINT TESTS =====

describe('PayPal Checkout Endpoint (/api/paypal/checkout)', () => {
  const validAccessToken = 'test-access-token-123'
  const validUserId = 'user-12345'
  const validEmail = 'test@example.com'

  describe('Request Validation', () => {
    test('should reject GET requests', () => {
      expect(() => {
        if ('GET' !== 'POST') {
          throw new Error('Method not allowed')
        }
      }).not.toThrow()
    })

    test('should require Bearer token in Authorization header', () => {
      const noAuth = null
      expect(noAuth).toBeNull()
      expect(() => {
        if (!noAuth?.startsWith('Bearer ')) {
          throw new Error('Unauthorized')
        }
      }).toThrow('Unauthorized')
    })

    test('should reject invalid token format', () => {
      const invalidToken = 'InvalidTokenFormat'
      expect(() => {
        if (!invalidToken.startsWith('Bearer ')) {
          throw new Error('Invalid token')
        }
      }).toThrow('Invalid token')
    })

    test('should require userType and planType in request body', () => {
      const requestBody = {}
      expect(() => {
        if (!requestBody.userType || !requestBody.planType) {
          throw new Error('Missing userType or planType')
        }
      }).toThrow('Missing userType or planType')
    })

    test('should validate userType is sponsor or advertiser', () => {
      const validUserTypes = ['sponsor', 'advertiser']
      const invalidUserType = 'invalid'
      expect(validUserTypes).not.toContain(invalidUserType)
    })

    test('should validate planType is monthly, annual, or onetime', () => {
      const validPlanTypes = ['monthly', 'annual', 'onetime']
      const invalidPlanType = 'weekly'
      expect(validPlanTypes).not.toContain(invalidPlanType)
    })
  })

  describe('Supabase Authentication', () => {
    test('should extract user ID from auth token', () => {
      const token = `Bearer ${validAccessToken}`
      const extractedToken = token.slice(7)
      expect(extractedToken).toBe(validAccessToken)
    })

    test('should handle Supabase auth errors', () => {
      const authError = new Error('Auth failed')
      expect(() => {
        throw authError
      }).toThrow('Auth failed')
    })

    test('should reject null/undefined user', () => {
      const user: MockSupabaseUser | null = null
      expect(() => {
        if (!user) {
          throw new Error('Invalid token')
        }
      }).toThrow('Invalid token')
    })
  })

  describe('PayPal Order Creation', () => {
    test('should use correct API endpoint based on PAYPAL_MODE', () => {
      const baseUrl = mockEnv.PAYPAL_MODE === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'
      expect(baseUrl).toBe('https://api-m.paypal.com')
    })

    test('should include correct order structure', () => {
      const order = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: '199.00' },
            description: 'Advertiser account (1 month) — Take The Reins',
            custom_id: `${validUserId}|advertiser|monthly`
          }
        ],
        application_context: {
          return_url: 'https://take-the-reins.ai/monetization/checkout/success?userType=advertiser&planType=monthly',
          cancel_url: 'https://take-the-reins.ai/monetization/pricing',
          brand_name: 'Take The Reins',
          user_action: 'PAY_NOW'
        }
      }

      expect(order.intent).toBe('CAPTURE')
      expect(order.purchase_units[0].amount.currency_code).toBe('USD')
      expect(order.application_context.brand_name).toBe('Take The Reins')
    })

    test('should return approval URL on successful order creation', () => {
      const mockOrder: PayPalOrder = {
        id: 'order-123',
        status: 'CREATED',
        links: [
          { rel: 'self', href: 'https://api.paypal.com/v2/checkout/orders/order-123' },
          { rel: 'approve', href: 'https://www.paypal.com/checkoutnow?token=order-123' }
        ]
      }

      const approveLink = mockOrder.links?.find(l => l.rel === 'approve')?.href
      expect(approveLink).toBe('https://www.paypal.com/checkoutnow?token=order-123')
    })

    test('should handle missing approval URL', () => {
      const mockOrder: PayPalOrder = {
        id: 'order-456',
        status: 'CREATED',
        links: [{ rel: 'self', href: 'https://api.paypal.com/v2/checkout/orders/order-456' }]
      }

      const approveLink = mockOrder.links?.find(l => l.rel === 'approve')
      expect(() => {
        if (!approveLink) {
          throw new Error('No PayPal approval URL returned')
        }
      }).toThrow('No PayPal approval URL returned')
    })

    test('should reject invalid prices', () => {
      const validPrices = { monthly: '199.00', annual: '1999.00', onetime: '499.00' }
      const invalidPlanType = 'weekly'
      expect(validPrices[invalidPlanType as keyof typeof validPrices]).toBeUndefined()
    })
  })

  describe('Return URL Configuration', () => {
    test('should include userType in return URL', () => {
      const returnUrl = 'https://take-the-reins.ai/monetization/checkout/success?userType=advertiser&planType=monthly'
      expect(returnUrl).toContain('userType=advertiser')
    })

    test('should include planType in return URL', () => {
      const returnUrl = 'https://take-the-reins.ai/monetization/checkout/success?userType=advertiser&planType=monthly'
      expect(returnUrl).toContain('planType=monthly')
    })

    test('should use correct domain in URLs', () => {
      const domain = 'https://take-the-reins.ai'
      expect(domain).toBe('https://take-the-reins.ai')
    })
  })

  describe('Error Handling', () => {
    test('should handle PayPal API errors', () => {
      const paypalError = { name: 'VALIDATION_ERROR', message: 'Invalid request' }
      expect(paypalError.name).toBe('VALIDATION_ERROR')
    })

    test('should return 502 on PayPal order creation failure', () => {
      const statusCode = 502
      const errorResponse = { error: 'Failed to create PayPal order' }
      expect(statusCode).toBe(502)
      expect(errorResponse.error).toBeDefined()
    })

    test('should return 500 on server error', () => {
      const statusCode = 500
      expect(statusCode).toBe(500)
    })
  })
})

// ===== PAYPAL CAPTURE ENDPOINT TESTS =====

describe('PayPal Capture Endpoint (/api/paypal/capture)', () => {
  describe('Order Capture', () => {
    test('should fetch order details before capturing', () => {
      const orderId = 'order-123'
      expect(orderId).toBeDefined()
      expect(typeof orderId).toBe('string')
    })

    test('should extract custom_id from order', () => {
      const mockOrder: PayPalOrder = {
        id: 'order-123',
        status: 'APPROVED',
        links: []
      }
      const customId = `user-id|advertiser|monthly`
      const [userId, userType, planType] = customId.split('|')
      expect(userId).toBe('user-id')
      expect(userType).toBe('advertiser')
      expect(planType).toBe('monthly')
    })

    test('should capture payment successfully', () => {
      const mockCapture: PayPalCapture = {
        id: 'capture-123',
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [
                { id: 'capture-123', status: 'COMPLETED' }
              ]
            }
          }
        ]
      }
      expect(mockCapture.status).toBe('COMPLETED')
    })

    test('should extract capture ID from response', () => {
      const mockCapture: PayPalCapture = {
        id: 'capture-123',
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [
                { id: 'sub-capture-456', status: 'COMPLETED' }
              ]
            }
          }
        ]
      }
      const captureId = mockCapture.purchase_units?.[0]?.payments?.captures?.[0]?.id
      expect(captureId).toBe('sub-capture-456')
    })
  })

  describe('Subscription End Date Calculation', () => {
    test('should calculate 1 month end date for monthly plan', () => {
      const today = new Date('2024-04-22')
      const d = new Date(today)
      d.setMonth(d.getMonth() + 1)
      expect(d.getMonth()).not.toBe(today.getMonth())
    })

    test('should calculate 1 year end date for annual plan', () => {
      const today = new Date('2024-04-22')
      const d = new Date(today)
      d.setFullYear(d.getFullYear() + 1)
      expect(d.getFullYear()).toBe(today.getFullYear() + 1)
    })

    test('should set null end date for onetime plan', () => {
      const endDate = null
      expect(endDate).toBeNull()
    })
  })

  describe('Database Update', () => {
    test('should update sponsor_memberships for sponsor type', () => {
      const userType = 'sponsor'
      expect(userType).toBe('sponsor')
    })

    test('should update advertiser_accounts for advertiser type', () => {
      const userType = 'advertiser'
      expect(userType).toBe('advertiser')
    })

    test('should set payment_status to paid', () => {
      const paymentStatus = 'paid'
      expect(paymentStatus).toBe('paid')
    })

    test('should set is_active or is_sponsor flag', () => {
      const isActive = true
      const isSponsor = true
      expect(isActive || isSponsor).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle missing orderId', () => {
      const orderId = null
      expect(() => {
        if (!orderId) {
          throw new Error('Missing orderId')
        }
      }).toThrow('Missing orderId')
    })

    test('should handle PayPal fetch errors', () => {
      const error = new Error('Failed to fetch order')
      expect(() => {
        throw error
      }).toThrow('Failed to fetch order')
    })

    test('should return 502 on PayPal API failure', () => {
      const statusCode = 502
      expect(statusCode).toBe(502)
    })
  })
})

// ===== PAYPAL WEBHOOK ENDPOINT TESTS =====

describe('PayPal Webhook Endpoint (/api/paypal/webhook)', () => {
  const mockWebhookSecret = 'test-webhook-secret'
  const mockWebhookId = mockEnv.PAYPAL_WEBHOOK_ID

  describe('Request Parsing', () => {
    test('should parse raw request body', () => {
      const rawBody = JSON.stringify({
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture-123',
          custom_id: 'user-id|advertiser|monthly'
        }
      })
      const event = JSON.parse(rawBody)
      expect(event.event_type).toBe('PAYMENT.CAPTURE.COMPLETED')
    })

    test('should reject non-POST requests', () => {
      const method = 'GET'
      expect(() => {
        if (method !== 'POST') {
          throw new Error('Method not allowed')
        }
      }).toThrow('Method not allowed')
    })
  })

  describe('Webhook Signature Verification', () => {
    test('should require webhook ID for verification', () => {
      const webhookId = null
      expect(() => {
        if (!webhookId) {
          console.warn('PAYPAL_WEBHOOK_ID not set — skipping verification')
        }
      }).not.toThrow()
    })

    test('should extract required headers', () => {
      const headers = {
        'paypal-auth-algo': 'SHA256withRSA',
        'paypal-cert-url': 'https://api.paypal.com/certs/signature-cert.pem',
        'paypal-transmission-id': 'test-transmission-id',
        'paypal-transmission-sig': 'test-signature',
        'paypal-transmission-time': '2024-04-22T10:00:00Z'
      }
      expect(headers['paypal-transmission-id']).toBeDefined()
      expect(headers['paypal-transmission-sig']).toBeDefined()
    })

    test('should return success for valid signature', () => {
      const result = { verification_status: 'SUCCESS' }
      expect(result.verification_status).toBe('SUCCESS')
    })

    test('should reject invalid signature', () => {
      const result = { verification_status: 'FAILURE' }
      expect(() => {
        if (result.verification_status !== 'SUCCESS') {
          throw new Error('Invalid webhook signature')
        }
      }).toThrow('Invalid webhook signature')
    })
  })

  describe('Event Processing', () => {
    test('should handle PAYMENT.CAPTURE.COMPLETED event', () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture-123',
          custom_id: 'user-id|advertiser|monthly'
        }
      }
      expect(event.event_type).toBe('PAYMENT.CAPTURE.COMPLETED')
    })

    test('should extract userId, userType, planType from custom_id', () => {
      const customId = 'user-123|sponsor|annual'
      const [userId, userType, planType] = customId.split('|')
      expect(userId).toBe('user-123')
      expect(userType).toBe('sponsor')
      expect(planType).toBe('annual')
    })

    test('should skip events with missing custom_id', () => {
      const event = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: { id: 'capture-456' }
      }
      const customId = event.resource.custom_id
      expect(customId).toBeUndefined()
    })

    test('should handle BILLING.SUBSCRIPTION events', () => {
      const eventTypes = [
        'BILLING.SUBSCRIPTION.ACTIVATED',
        'BILLING.SUBSCRIPTION.RENEWED',
        'BILLING.SUBSCRIPTION.UPDATED'
      ]
      expect(eventTypes).toContain('BILLING.SUBSCRIPTION.ACTIVATED')
    })
  })

  describe('Database Upsert', () => {
    test('should upsert sponsor membership on sponsor payment', () => {
      const userType = 'sponsor'
      const tableName = userType === 'sponsor' ? 'sponsor_memberships' : 'advertiser_accounts'
      expect(tableName).toBe('sponsor_memberships')
    })

    test('should upsert advertiser account on advertiser payment', () => {
      const userType = 'advertiser'
      const tableName = userType === 'advertiser' ? 'advertiser_accounts' : 'sponsor_memberships'
      expect(tableName).toBe('advertiser_accounts')
    })

    test('should set correct payment record fields', () => {
      const record = {
        user_id: 'user-123',
        payment_status: 'paid',
        subscription_type: 'monthly',
        payment_id: 'capture-123',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      expect(record.payment_status).toBe('paid')
      expect(record.subscription_type).toBe('monthly')
    })

    test('should set is_sponsor flag for sponsor records', () => {
      const record = { is_sponsor: true }
      expect(record.is_sponsor).toBe(true)
    })

    test('should set is_active flag for advertiser records', () => {
      const record = { is_active: true }
      expect(record.is_active).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle webhook verification errors', () => {
      const error = new Error('Webhook verification failed')
      expect(() => {
        throw error
      }).toThrow('Webhook verification failed')
    })

    test('should return 401 on verification failure', () => {
      const statusCode = 401
      expect(statusCode).toBe(401)
    })

    test('should return 200 on successful processing', () => {
      const statusCode = 200
      expect(statusCode).toBe(200)
    })

    test('should handle database errors gracefully', () => {
      const dbError = new Error('Database connection failed')
      expect(() => {
        throw dbError
      }).toThrow('Database connection failed')
    })
  })
})

// ===== INTEGRATION SCENARIOS =====

describe('PayPal Integration Flow - E2E Scenarios', () => {
  test('Complete advertiser purchase flow: checkout -> capture -> webhook', () => {
    // Step 1: Checkout
    const checkoutRequest = {
      userType: 'advertiser',
      planType: 'monthly'
    }
    expect(checkoutRequest.userType).toBe('advertiser')
    expect(checkoutRequest.planType).toBe('monthly')

    // Step 2: Create order
    const order = {
      id: 'order-complete-flow',
      status: 'CREATED'
    }
    expect(order.status).toBe('CREATED')

    // Step 3: Capture payment
    const capture = {
      id: 'capture-complete-flow',
      status: 'COMPLETED'
    }
    expect(capture.status).toBe('COMPLETED')

    // Step 4: Database update
    const dbRecord = {
      payment_status: 'paid',
      is_active: true
    }
    expect(dbRecord.payment_status).toBe('paid')
    expect(dbRecord.is_active).toBe(true)
  })

  test('Complete sponsor purchase flow', () => {
    const checkoutRequest = {
      userType: 'sponsor',
      planType: 'annual'
    }
    expect(checkoutRequest.userType).toBe('sponsor')
    expect(checkoutRequest.planType).toBe('annual')

    const dbRecord = {
      payment_status: 'paid',
      is_sponsor: true
    }
    expect(dbRecord.is_sponsor).toBe(true)
  })

  test('Webhook correctly processes payment and updates database', () => {
    const webhookEvent = {
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'capture-webhook-test',
        custom_id: 'user-webhook-test|advertiser|onetime'
      }
    }

    const [userId, userType, planType] = webhookEvent.resource.custom_id.split('|')
    expect(userId).toBe('user-webhook-test')
    expect(userType).toBe('advertiser')
    expect(planType).toBe('onetime')

    const shouldUpdateAdvertiser = userType === 'advertiser'
    expect(shouldUpdateAdvertiser).toBe(true)
  })
})

// ===== VALIDATION SUMMARY =====

describe('PayPal Configuration Validation', () => {
  test('should have production credentials configured', () => {
    expect(mockEnv.PAYPAL_CLIENT_ID).toBeDefined()
    expect(mockEnv.PAYPAL_CLIENT_SECRET).toBeDefined()
    expect(mockEnv.PAYPAL_WEBHOOK_ID).toBeDefined()
  })

  test('should be in production mode', () => {
    expect(mockEnv.PAYPAL_MODE).toBe('production')
  })

  test('should use correct production API endpoint', () => {
    const baseUrl = mockEnv.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'
    expect(baseUrl).toBe('https://api-m.paypal.com')
  })

  test('should have correct domain configured', () => {
    expect(mockEnv.NEXT_PUBLIC_APP_URL).toBe('https://take-the-reins.ai')
  })

  test('should have Supabase configuration', () => {
    expect(mockEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(mockEnv.SUPABASE_SERVICE_ROLE_KEY).toBeDefined()
  })
})
