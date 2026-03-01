import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not initialized' })
  }

  if (req.method === 'GET') {
    // Test: Generate a test manifesto and insert it
    console.log('=== TEST MANIFESTO FLOW ===')
    
    const testId = crypto.randomBytes(6).toString('hex')
    const testContent = `Test Manifesto ${testId}`
    const testUsername = `test-${testId}`

    console.log('1. Testing INSERT into public_manifestos...')
    const { data: insertData, error: insertError } = await supabase
      .from('public_manifestos')
      .insert({
        id: testId,
        content: testContent,
        username: testUsername,
        questions_data: JSON.stringify([{ question: 'test q', answer: 'test a' }]),
      })
      .select()

    if (insertError) {
      console.error('INSERT ERROR:', insertError)
      return res.status(400).json({ error: 'Insert failed', details: insertError })
    }
    console.log('INSERT SUCCESS')

    console.log('2. Testing SELECT from public_manifestos...')
    const { data: selectData, error: selectError } = await supabase
      .from('public_manifestos')
      .select('*')
      .eq('id', testId)
      .single()

    if (selectError) {
      console.error('SELECT ERROR:', selectError)
      return res.status(400).json({ error: 'Select failed', details: selectError })
    }
    console.log('SELECT SUCCESS')

    return res.status(200).json({
      message: 'Test passed!',
      testId: testId,
      inserted: insertData,
      selected: selectData,
      url: `/manifesto/${testId}`,
    })
  }

  if (req.method === 'POST') {
    // Test: Fetch a specific manifesto by ID
    const { testId } = req.body

    console.log(`Testing fetch for ID: ${testId}`)
    const { data, error } = await supabase
      .from('public_manifestos')
      .select('*')
      .eq('id', testId)
      .single()

    if (error) {
      console.error('Fetch error:', error)
      return res.status(404).json({ error: 'Not found', details: error })
    }

    console.log('Fetch success:', data)
    return res.status(200).json({ success: true, data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
