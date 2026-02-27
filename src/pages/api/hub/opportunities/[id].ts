import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabase()
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Opportunity ID is required' })
  }

  // GET: Fetch single opportunity
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('hub_opportunities')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return res.status(404).json({ error: 'Opportunity not found' })

      res.status(200).json(data)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
