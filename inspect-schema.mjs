#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const client = createClient(supabaseUrl, anonKey)

console.log('Inspecting database schema...\n')

// Check user_profiles columns
console.log('📋 user_profiles table:')
try {
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  if (error && error.code === 'PGRST116') {
    console.log('  Table exists but empty - cannot determine columns from data')
    console.log('  (Try: SELECT * FROM user_profiles LIMIT 0;)')
  } else if (error) {
    console.log(`  Error: ${error.code} - ${error.message}`)
  } else if (data && data.length > 0) {
    const columns = Object.keys(data[0])
    console.log(`  Columns found: ${columns.join(', ')}`)
  } else {
    console.log('  Table accessible but no sample data')
  }
} catch (e) {
  console.log(`  Exception: ${e.message}`)
}

// Check manifestos columns
console.log('\n📋 manifestos table:')
try {
  const { data, error } = await client
    .from('manifestos')
    .select('*')
    .limit(1)
  
  if (error && error.code === 'PGRST116') {
    console.log('  Table exists but empty - cannot determine columns from data')
  } else if (error) {
    console.log(`  Error: ${error.code} - ${error.message}`)
  } else if (data && data.length > 0) {
    const columns = Object.keys(data[0])
    console.log(`  Columns found: ${columns.join(', ')}`)
  } else {
    console.log('  Table accessible but no sample data')
  }
} catch (e) {
  console.log(`  Exception: ${e.message}`)
}

// Try direct SQL inspection via PostgreSQL INFORMATION_SCHEMA
console.log('\n📋 Checking via information_schema...')
try {
  const { data: columns, error } = await client
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .in('table_name', ['user_profiles', 'manifestos'])

  if (error) {
    console.log(`  Cannot access information_schema: ${error.message}`)
  } else if (columns) {
    const grouped = {}
    columns.forEach(col => {
      if (!grouped[col.table_name]) grouped[col.table_name] = []
      grouped[col.table_name].push(`${col.column_name} (${col.data_type})`)
    })
    
    Object.entries(grouped).forEach(([table, cols]) => {
      console.log(`\n  ${table}:`)
      cols.forEach(col => console.log(`    - ${col}`))
    })
  }
} catch (e) {
  console.log(`  Exception: ${e.message}`)
}

// Try simple wildcard selects to trigger schema introspection
console.log('\n📋 Simple select * attempt (to triggers schema introspection):')
try {
  const { error: userError } = await client
    .from('user_profiles')
    .select('*')
    .limit(0)
  
  if (userError && userError.code === 'PGRST116') {
    console.log('  user_profiles: EXISTS (empty)')
  } else if (userError) {
    console.log(`  user_profiles Error: ${userError.code}`)
  } else {
    console.log('  user_profiles: OK')
  }
} catch (e) {
  console.log(`  user_profiles Exception: ${e.message}`)
}

try {
  const { error: manifestoError } = await client
    .from('manifestos')
    .select('*')
    .limit(0)
  
  if (manifestoError && manifestoError.code === 'PGRST116') {
    console.log('  manifestos: EXISTS (empty)')
  } else if (manifestoError) {
    console.log(`  manifestos Error: ${manifestoError.code}`)
  } else {
    console.log('  manifestos: OK')
  }
} catch (e) {
  console.log(`  manifestos Exception: ${e.message}`)
}
