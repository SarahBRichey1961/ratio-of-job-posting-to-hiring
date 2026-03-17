import { createClient } from '@supabase/supabase-js'

async function addTestAds() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const testAds = [
    {
      title: 'Acme Corp Careers',
      description: 'Join our growing team',
      banner_image_url: 'https://via.placeholder.com/1200x300?text=Acme+Corp+Careers',
      banner_height: 300,
      click_url: 'https://acme-corp.example.com/careers',
      alt_text: 'Acme Corp is hiring',
      is_active: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    },
    {
      title: 'TechStart Hiring',
      description: 'Senior Engineers Wanted',
      banner_image_url: 'https://via.placeholder.com/1200x300?text=TechStart+Hiring',
      banner_height: 250,
      click_url: 'https://techstart.example.com/jobs',
      alt_text: 'TechStart is hiring senior engineers',
      is_active: true,
      expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days from now
    },
    {
      title: 'Global Talent Network',
      description: 'Find your next opportunity',
      banner_image_url: 'https://via.placeholder.com/1200x300?text=Global+Talent+Network',
      banner_height: 280,
      click_url: 'https://globtalent.example.com',
      alt_text: 'Global Talent Network job board',
      is_active: true,
      expires_at: null // No expiration
    }
  ]

  try {
    console.log('Adding test advertisements...')
    const { data, error } = await supabase
      .from('advertisements')
      .insert(testAds)
      .select()

    if (error) {
      console.error('Error adding ads:', error)
      return
    }

    console.log(`✅ Successfully added ${data?.length || 0} test advertisements`)
    data?.forEach(ad => {
      console.log(`  - ${ad.title} (ID: ${ad.id})`)
    })
  } catch (err) {
    console.error('Failed to add test ads:', err)
  }
}

addTestAds()
