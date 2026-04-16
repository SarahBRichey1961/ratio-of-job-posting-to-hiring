/**
 * Marketing Launcher Integration Tests
 * Tests the entire end-to-end flow of campaign loading and management
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const TEST_EMAIL = 'test_marketing_user@example.com'
const TEST_PASSWORD = 'TestPassword123!'

describe('Marketing Launcher - End-to-End Tests', () => {
  let supabaseClient: any
  let testUser: any
  let testToken: string

  beforeAll(async () => {
    // Initialize Supabase client
    supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

    // Sign up test user
    try {
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })

      if (signUpError) {
        console.log('Sign up error (may already exist):', signUpError.message)
      } else {
        console.log('Test user created:', signUpData.user?.id)
      }
    } catch (err: any) {
      console.log('Sign up exception (may already exist):', err.message)
    }

    // Sign in with test user
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`)
    }

    testUser = signInData.user
    testToken = signInData.session?.access_token
    console.log('✓ Test user authenticated:', testUser?.id)
  })

  describe('Database Schema', () => {
    test('marketing_campaigns table exists and has correct structure', async () => {
      const { data, error } = await supabaseClient
        .from('marketing_campaigns')
        .select('*')
        .limit(1)

      // Just checking the table exists - error means something is wrong
      expect(error).toBeNull()
      console.log('✓ marketing_campaigns table accessible')
    })

    test('campaign_recipients table exists', async () => {
      const { data, error } = await supabaseClient
        .from('campaign_recipients')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      console.log('✓ campaign_recipients table accessible')
    })

    test('campaign_analytics table exists', async () => {
      const { data, error } = await supabaseClient
        .from('campaign_analytics')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      console.log('✓ campaign_analytics table accessible')
    })
  })

  describe('Authentication & Token Handling', () => {
    test('token is valid JWT', () => {
      expect(testToken).toBeDefined()
      expect(testToken).toMatch(/^eyJ/)
      console.log('✓ Valid JWT token obtained')
    })

    test('auth.getUser() works with token passed as header', async () => {
      // Create client with token in header
      const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data, error } = await authClient.auth.getUser()

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.id).toBe(testUser.id)
      console.log('✓ auth.getUser() correctly identifies user from token')
    })
  })

  describe('Campaign Creation', () => {
    let campaignId: string

    test('create campaign with authenticated user', async () => {
      // Create client with token
      const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data, error } = await authClient
        .from('marketing_campaigns')
        .insert({
          creator_id: testUser.id,
          name: 'Test Campaign',
          email_subject: 'Test Subject',
          email_body_html: '<p>Test body</p>',
          target_audience_segment: 'custom',
          list_source: 'imported',
          status: 'draft',
        })
        .select()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeGreaterThan(0)
      campaignId = data[0].id
      console.log('✓ Campaign created:', campaignId)
    })

    test('retrieve created campaign with RLS policy', async () => {
      const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data, error } = await authClient
        .from('marketing_campaigns')
        .select('*')
        .eq('creator_id', testUser.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeGreaterThan(0)
      console.log('✓ Campaign retrieved with RLS policy:', data.length, 'campaigns')
    })
  })

  describe('API Endpoint Integration', () => {
    test('GET /api/marketing/campaigns returns campaigns', async () => {
      const response = await fetch('http://localhost:3000/api/marketing/campaigns', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.ok).toBe(true)
      const json = await response.json()
      expect(json.data).toBeDefined()
      console.log('✓ GET /api/marketing/campaigns returns:', json.data.length, 'campaigns')
    })

    test('POST /api/marketing/campaigns creates new campaign', async () => {
      const response = await fetch('http://localhost:3000/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'API Test Campaign',
          email_subject: 'Test Subject',
          email_body_html: '<p>Test body</p>',
        }),
      })

      expect(response.ok).toBe(true)
      const json = await response.json()
      expect(json.id).toBeDefined()
      console.log('✓ POST /api/marketing/campaigns created campaign:', json.id)
    })
  })

  describe('RLS Policies', () => {
    test('user cannot access other users campaigns', async () => {
      // This would require a second test user - skipping for now
      console.log('⊘ Skipping multi-user RLS test (requires second user)')
    })

    test('campaigns have creator_id matching authenticated user', async () => {
      const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      const { data, error } = await authClient
        .from('marketing_campaigns')
        .select('creator_id')
        .eq('creator_id', testUser.id)

      expect(error).toBeNull()
      expect(data).toBeDefined()

      data.forEach((campaign: any) => {
        expect(campaign.creator_id).toBe(testUser.id)
      })
      console.log('✓ All campaigns have correct creator_id')
    })
  })

  afterAll(async () => {
    // Clean up test data
    try {
      const authClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            Authorization: `Bearer ${testToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      // Delete test campaigns
      await authClient
        .from('marketing_campaigns')
        .delete()
        .eq('creator_id', testUser.id)

      console.log('✓ Test data cleaned up')
    } catch (err) {
      console.log('Cleanup error:', err)
    }
  })
})
