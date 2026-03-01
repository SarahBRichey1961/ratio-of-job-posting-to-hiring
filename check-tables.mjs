#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const client = createClient(supabaseUrl, anonKey)

console.log('Checking available tables in Supabase...\n')

// Try to access each table we expect
const tablesToCheck = ['user_profiles', 'manifestos', 'auth_users']

for (const table of tablesToCheck) {
  try {
    const { data, error, status } = await client
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error && error.code === 'PGRST116') {
      console.log(`✅ ${table} - EXISTS (but empty or no access)`)
    } else if (error && error.code === 'PGRST205') {
      console.log(`❌ ${table} - NOT FOUND`)
    } else if (error) {
      console.log(`⚠️  ${table} - ERROR: ${error.code}`)
    } else {
      console.log(`✅ ${table} - EXISTS and accessible`)
    }
  } catch (e) {
    console.log(`❌ ${table} - Exception: ${e.message}`)
  }
}

console.log('\nAttempting to check schema directly...')
try {
  const { data, error } = await client.from('information_schema.tables').select('table_name').eq('table_schema', 'public')
  
  if (error) {
    console.log(`Cannot access information_schema: ${error.message}`)
  } else {
    console.log('\nPublic tables:')
    data.forEach(row => console.log(`  - ${row.table_name}`))
  }
} catch (e) {
  console.log(`Exception: ${e.message}`)
}
