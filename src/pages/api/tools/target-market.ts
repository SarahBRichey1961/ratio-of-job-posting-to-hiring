import { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'

export interface TargetMarketRequest {
  productService: string
  productCategory: string
  customerType: 'b2b' | 'b2c' | 'both'
  ageRange: string
  incomeLevel: string
  interests: string[]
  geographicFocus: string
  onlineShoppingPropensity: 'high' | 'medium' | 'low'
  industryPreference: string
  additionalContext: string
}

export interface StockPick {
  ticker: string
  name: string
  sector: string
  relevance: string
  momentumReason: string
}

export interface CompanyRecommendation {
  name: string
  ticker: string
  sector: string
  whyItFits: string
  marketTrend: string
  approachSuggestion: string
  growthSignal: string
}

export interface TargetMarketResult {
  summary: string
  targetPersona: string
  companies: CompanyRecommendation[]
  stockPicks: StockPick[]
  housingMarketInsight: string
  economicContext: string
  actionableNextSteps: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' })
  }

  const input: TargetMarketRequest = req.body

  if (!input.productService || !input.customerType) {
    return res.status(400).json({ error: 'Missing required fields: productService, customerType' })
  }

  const client = new Anthropic({ apiKey })

  const prompt = `You are a business strategy and market research expert. Help this person identify the best target companies to approach as potential clients, employers, or partners.

## Profile
- Offering: ${input.productService}
- Category: ${input.productCategory || 'Not specified'}
- Customer type: ${input.customerType.toUpperCase()}
- Geography: ${input.geographicFocus || 'National (US)'}
- Preferred industry: ${input.industryPreference || 'Open to all'}
- Age range of end customer: ${input.ageRange || 'Not specified'}
- Income level: ${input.incomeLevel || 'Not specified'}
- Interests: ${input.interests?.join(', ') || 'Not specified'}
- Online shopping propensity: ${input.onlineShoppingPropensity}
- Additional context: ${input.additionalContext || 'None'}

Using your knowledge of current market trends, growing companies, housing market conditions, and economic context as of early 2026, provide a target market analysis.

Return ONLY valid JSON (no markdown, no code blocks) matching this structure exactly:
{"summary":"2-3 sentence overview","targetPersona":"detailed persona description","companies":[{"name":"Company name","ticker":"ticker or Private","sector":"sector","whyItFits":"2-3 sentences","marketTrend":"current trend","approachSuggestion":"specific actionable advice","growthSignal":"key growth indicator"}],"stockPicks":[{"ticker":"REAL_TICKER","name":"Full company name","sector":"sector","relevance":"1 sentence why relevant to this person's product/market","momentumReason":"1 sentence describing growth momentum as of early 2026"}],"housingMarketInsight":"housing market relevance","economicContext":"broader economic context","actionableNextSteps":["step1","step2","step3","step4","step5"]}

Include 6 company recommendations. For stockPicks include exactly 5 PUBLICLY TRADED companies (real NYSE/NASDAQ tickers) that are showing strong upward momentum in the relevant sector as of early 2026 — companies whose growth aligns with this person's product/service/industry. Use only real valid US stock tickers.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract the outermost JSON object regardless of surrounding markdown/text
    const firstBrace = responseText.indexOf('{')
    const lastBrace = responseText.lastIndexOf('}')
    const cleaned = firstBrace !== -1 && lastBrace > firstBrace
      ? responseText.slice(firstBrace, lastBrace + 1)
      : responseText.trim()

    let result: TargetMarketResult
    try {
      result = JSON.parse(cleaned)
    } catch {
      console.error('[target-market] Parse error. Raw response:', responseText.slice(0, 800))
      return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText.slice(0, 500) })
    }

    return res.status(200).json(result)
  } catch (err: any) {
    console.error('[target-market] Claude API error:', err)
    return res.status(500).json({ error: err.message || 'AI analysis failed' })
  }
}
