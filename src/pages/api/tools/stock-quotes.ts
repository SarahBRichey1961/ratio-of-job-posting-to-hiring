import { NextApiRequest, NextApiResponse } from 'next'

export interface StockQuoteResult {
  ticker: string
  price: number | null
  changePercent: number | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tickers } = req.body as { tickers: string[] }
  const clean = (tickers || [])
    .filter(t => /^[A-Z]{1,6}$/.test(t))
    .slice(0, 5)

  if (!clean.length) return res.status(200).json([])

  const results = await Promise.allSettled(
    clean.map(async (ticker): Promise<StockQuoteResult> => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockFetcher/1.0)' },
        signal: AbortSignal.timeout(5000),
      })
      const data = await r.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta) throw new Error('No data')
      const price: number = meta.regularMarketPrice
      const prevClose: number = meta.chartPreviousClose ?? meta.previousClose
      const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : null
      return { ticker, price: Math.round(price * 100) / 100, changePercent: changePercent != null ? Math.round(changePercent * 100) / 100 : null }
    })
  )

  const quotes: StockQuoteResult[] = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { ticker: clean[i], price: null, changePercent: null }
  )

  return res.status(200).json(quotes)
}
