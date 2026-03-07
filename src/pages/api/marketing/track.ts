import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { campaign_id, recipient_id, event } = req.query

  if (!campaign_id || !recipient_id || !event) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  const eventType = Array.isArray(event) ? event[0] : event

  try {
    const supabase = getSupabase()

    // Update recipient event
    if (eventType === 'open') {
      const { error } = await supabase
        .from('campaign_recipients')
        .update({
          opened_at: new Date().toISOString(),
          status: 'opened',
        })
        .eq('id', recipient_id)

      if (error) throw error

      // Increment opened count in analytics
      const { data: analytics } = await supabase
        .from('campaign_analytics')
        .select('opened')
        .eq('campaign_id', campaign_id)
        .single()

      if (analytics) {
        await supabase
          .from('campaign_analytics')
          .update({ opened: (analytics.opened || 0) + 1 })
          .eq('campaign_id', campaign_id)
      }
    } else if (eventType === 'click') {
      const { error } = await supabase
        .from('campaign_recipients')
        .update({
          clicked_at: new Date().toISOString(),
          status: 'clicked',
        })
        .eq('id', recipient_id)

      if (error) throw error

      // Increment clicked count in analytics
      const { data: analytics } = await supabase
        .from('campaign_analytics')
        .select('clicked')
        .eq('campaign_id', campaign_id)
        .single()

      if (analytics) {
        await supabase
          .from('campaign_analytics')
          .update({ clicked: (analytics.clicked || 0) + 1 })
          .eq('campaign_id', campaign_id)
      }
    } else if (eventType === 'convert') {
      const { error } = await supabase
        .from('campaign_recipients')
        .update({
          converted_at: new Date().toISOString(),
          status: 'converted',
        })
        .eq('id', recipient_id)

      if (error) throw error

      // Increment converted count in analytics
      const { data: analytics } = await supabase
        .from('campaign_analytics')
        .select('converted')
        .eq('campaign_id', campaign_id)
        .single()

      if (analytics) {
        await supabase
          .from('campaign_analytics')
          .update({ converted: (analytics.converted || 0) + 1 })
          .eq('campaign_id', campaign_id)
      }
    }

    // Return 1x1 transparent GIF for tracking pixel
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
      0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ])

    res.setHeader('Content-Type', 'image/gif')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.status(200).send(gif)
  } catch (error) {
    console.error('Tracking error:', error)
    // Still return success for event tracking to avoid client-side errors
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
      0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
      0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
    ])
    res.setHeader('Content-Type', 'image/gif')
    res.status(200).send(gif)
  }
}
