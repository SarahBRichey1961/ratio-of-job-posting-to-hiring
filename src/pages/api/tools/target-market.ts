import { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'

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
  housingMarketInsight: string
  economicContext: string
  actionableNextSteps: string[]
}

async function fetchTopGainingStocks(): Promise<string> {
  try {
    const response = await axios.get(
      'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/screener',
      {
        params: { type: 'gainers', start: '0', count: '20' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com',
        },
        timeout: 8000,
      }
    )
    const quotes = response.data?.body?.quotes || []
    const gainers = quotes.slice(0, 15).map((q: any) =>
      `${q.symbol} (${q.shortName || q.longName || 'N/A'}) - sector: ${q.sector || 'N/A'}, change: ${q.regularMarketChangePercent?.toFixed(2) || 'N/A'}%, industry: ${q.industry || 'N/A'}`
    )
    return gainers.join('\n')
  } catch {
    return 'Stock data temporarily unavailable - use general market knowledge'
  }
}

async function fetchHousingData(): Promise<string> {
  try {
    const response = await axios.get(
      'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/screener',
      {
        params: { type: 'real-estate', start: '0', count: '10' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com',
        },
        timeout: 8000,
      }
    )
    const quotes = response.data?.body?.quotes || []
    const reits = quotes.slice(0, 8).map((q: any) =>
      `${q.symbol} (${q.shortName || 'N/A'}) - change: ${q.regularMarketChangePercent?.toFixed(2) || 'N/A'}%`
    )
    return reits.join('\n')
  } catch {
    return 'Housing/REIT data temporarily unavailable - use general market knowledge'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Add it to your .env.local file.' })
  }

  const input: TargetMarketRequest = req.body

  if (!input.productService || !input.customerType) {
    return res.status(400).json({ error: 'Missing required fields: productService, customerType' })
  }

  // Fetch market data in parallel
  const [stockData, housingData] = await Promise.all([
    fetchTopGainingStocks(),
    fetchHousingData(),
  ])

  const client = new Anthropic({ apiKey })

  const prompt = `You are a business strategy and market research expert helping someone identify the best target companies to approach — either as potential employers, clients, or partners.

## Their Business/Product Profile
- **What they're selling/offering:** ${input.productService}
- **Product category:** ${input.productCategory || 'Not specified'}
- **Customer type:** ${input.customerType === 'b2b' ? 'Business-to-Business (B2B)' : input.customerType === 'b2c' ? 'Business-to-Consumer (B2C)' : 'Both B2B and B2C'}
- **Geographic focus:** ${input.geographicFocus || 'National (US)'}
- **Preferred industry:** ${input.industryPreference || 'Open to all industries'}
- **Additional context:** ${input.additionalContext || 'None provided'}

## Target Customer Demographics
- **Age range:** ${input.ageRange || 'Not specified'}
- **Income level:** ${input.incomeLevel || 'Not specified'}
- **Key interests:** ${input.interests?.join(', ') || 'Not specified'}
- **Online shopping propensity:** ${input.onlineShoppingPropensity}

## Current Stock Market — Top Gainers (live data)
${stockData}

## Real Estate / Housing Market Signals (REITs)
${housingData}

---

Based on this profile and the live market data above, provide a comprehensive target market analysis. Return your response as valid JSON matching this exact structure:

{
  "summary": "2-3 sentence overview of their ideal market position",
  "targetPersona": "Detailed description of their ideal customer/client/employer persona",
  "companies": [
    {
      "name": "Company name",
      "ticker": "Stock ticker or 'Private'",
      "sector": "Industry sector",
      "whyItFits": "Why this company aligns with their profile (2-3 sentences)",
      "marketTrend": "Current market trend for this company/sector",
      "approachSuggestion": "Specific actionable suggestion for how to approach this company",
      "growthSignal": "Key growth signal or indicator"
    }
  ],
  "housingMarketInsight": "How housing/real estate trends relate to their opportunity",
  "economicContext": "Broader economic context relevant to their target market",
  "actionableNextSteps": [
    "Step 1...",
    "Step 2...",
    "Step 3...",
    "Step 4...",
    "Step 5..."
  ]
}

Include 6-8 specific company recommendations. Prioritize companies that are growing, have public signals of expansion, and align with the customer demographics. Mix in 1-2 that align with housing/real estate trends if relevant. Be specific and actionable — this person is unemployed and needs concrete targets.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from potential markdown code blocks
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/(\{[\s\S]*\})/)
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText

    let result: TargetMarketResult
    try {
      result = JSON.parse(jsonStr)
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response', raw: responseText })
    }

    return res.status(200).json(result)
  } catch (err: any) {
    console.error('[target-market] Claude API error:', err)
    return res.status(500).json({ error: err.message || 'AI analysis failed' })
  }
}
