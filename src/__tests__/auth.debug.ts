/**
 * Debug test for auth flow
 * Run: npx ts-node src/__tests__/auth.debug.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testAuthFlow() {
  console.log('\n=== AUTH FLOW DEBUG TEST ===\n')

  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'test12345'

  try {
    // Step 1: Sign up
    console.log(`1. Signing up with ${testEmail}...`)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (signUpError) {
      console.error('❌ Signup failed:', signUpError.message)
      return
    }

    console.log('✓ Signup successful, user ID:', signUpData.user?.id)
    const userId = signUpData.user?.id!

    // Step 2: Sign in
    console.log('\n2. Signing in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInError) {
      console.error('❌ Sign-in failed:', signInError.message)
      return
    }

    console.log('✓ Sign-in successful')
    const token = signInData.session?.access_token!

    // Step 3: Create authenticated client
    console.log('\n3. Creating authenticated client...')
    const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    console.log('✓ Authenticated client created')

    // Step 4: Try to insert profile
    console.log('\n4. Inserting profile...')
    const { data: profileData, error: profileError } = await authenticatedClient
      .from('user_profiles')
      .insert({
        id: userId,
        email: testEmail,
        role: 'viewer',
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile insert failed:', profileError.message)
      console.error('   Code:', profileError.code)
      console.error('   Details:', profileError.details)
      return
    }

    console.log('✓ Profile created:', profileData)

    // Step 5: Try to insert manifesto
    console.log('\n5. Inserting manifesto...')
    const { data: manifestoData, error: manifestoError } = await authenticatedClient
      .from('manifestos')
      .insert({
        user_id: userId,
        content: 'This is a test manifesto',
        slug: testEmail,
        title: 'Test Manifesto',
        published: true,
        public_url: `https://example.com/manifesto/${testEmail}`,
      })
      .select()
      .single()

    if (manifestoError) {
      console.error('❌ Manifesto insert failed:', manifestoError.message)
      console.error('   Code:', manifestoError.code)
      console.error('   Details:', manifestoError.details)
      return
    }

    console.log('✓ Manifesto created:', manifestoData)

    console.log('\n✅ ALL TESTS PASSED\n')

  } catch (error: any) {
    console.error('\n❌ Unexpected error:', error.message)
    console.error(error)
  }
}

testAuthFlow()
