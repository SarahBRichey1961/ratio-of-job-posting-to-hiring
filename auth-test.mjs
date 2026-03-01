import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eikhrkharihagaorqqcf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ'

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function test() {
  const email = `testuser@example.com`
  const pwd = 'test12345'

  console.log('\n🧪 Testing Auth Flow\n')

  // Signup
  console.log(`📝 Signing up: ${email}`)
  const { data: signup, error: signupErr } = await client.auth.signUp({ email, password: pwd })
  if (signupErr) {console.error('❌', signupErr);process.exit(1)}
  const userId = signup.user.id
  console.log('✓ Signup OK, userId:', userId)

  // Sign in
  console.log('\n🔑 Signing in...')
  const { data: signin, error: signinErr } = await client.auth.signInWithPassword({ email, password: pwd })
  if (signinErr) {console.error('❌', signinErr);process.exit(1)}
  const token = signin.session.access_token
  console.log('✓ Signin OK')

  // Create authenticated client
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` }}
  })

  // Try to create profile
  console.log('\n👤 Creating profile...')
  const { data: profile, error: profileErr } = await authClient
    .from('user_profiles')
    .insert({ id: userId, email, role: 'viewer' })
    .select()
    .single()

  if (profileErr) {
    console.error('❌ Profile error:', profileErr.message)
    if (profileErr.code) console.error('   Code:', profileErr.code)
  } else {
    console.log('✓ Profile created:', profile.id)
  }

  // Try to create manifesto
  console.log('\n📄 Creating manifesto...')
  const { data: manifesto, error: manifestoErr } = await authClient
    .from('manifestos')
    .insert({
      user_id: userId,
      content: 'Test content',
      slug: email,
      title: 'Test',
      published: true,
      public_url: `http://example.com/${email}`,
    })
    .select()
    .single()

  if (manifestoErr) {
    console.error('❌ Manifesto error:', manifestoErr.message)
    if (manifestoErr.code) console.error('   Code:', manifestoErr.code)
    if (manifestoErr.details) console.error('   Details:', manifestoErr.details)
  } else {
    console.log('✓ Manifesto created:', manifesto.id)
  }

  console.log('\n✅ Done\n')
}

test().catch(e => {console.error(e); process.exit(1)})
