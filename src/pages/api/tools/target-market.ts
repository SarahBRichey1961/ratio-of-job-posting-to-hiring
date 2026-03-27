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

export interface CompetitorInsight {
  name: string
  whatTheyDoWell: string
  gapOrWeakness: string
  yourOpportunity: string
}

export interface TargetMarketResult {
  summary: string
  targetPersona: string
  companies: CompanyRecommendation[]
  stockPicks: StockPick[]
  competitiveLandscape: CompetitorInsight[]
  marketGapSummary: string
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

Return ONLY valid JSON (no markdown, no code blocks):
{"summary":"2 sentences","targetPersona":"1 paragraph","companies":[{"name":"","ticker":"ticker or Private","sector":"","whyItFits":"2 sentences","marketTrend":"1 sentence","approachSuggestion":"1 sentence","growthSignal":"1 sentence"}],"stockPicks":[{"ticker":"REAL_TICKER","name":"","sector":"","relevance":"1 sentence","momentumReason":"1 sentence"}],"competitiveLandscape":[{"name":"","whatTheyDoWell":"1 sentence","gapOrWeakness":"1 sentence","yourOpportunity":"1 sentence"}],"marketGapSummary":"2 sentences","housingMarketInsight":"1 sentence","economicContext":"1 sentence","actionableNextSteps":["step1","step2","step3"]}

Rules: 4 companies. 5 stock picks (real NYSE/NASDAQ tickers only). 3 competitive landscape entries. Keep all values concise — 1-2 sentences max per field.`

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
