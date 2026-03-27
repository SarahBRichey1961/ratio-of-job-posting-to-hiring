import React, { useState } from 'react'
import Head from 'next/head'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import type { TargetMarketRequest, TargetMarketResult, CompanyRecommendation, StockPick } from '../api/tools/target-market'
import type { StockQuoteResult } from '../api/tools/stock-quotes'

const INTERESTS = [
  'Technology', 'Health & Wellness', 'Finance', 'Real Estate', 'E-commerce',
  'Education', 'Travel', 'Food & Beverage', 'Fashion & Apparel', 'Sports & Fitness',
  'Home Improvement', 'Entertainment', 'Automotive', 'Sustainability/Green',
  'Pet Products', 'Beauty & Personal Care', 'Gaming', 'Parenting & Family',
]

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'All ages']
const INCOME_LEVELS = ['Under $35k', '$35k–$75k', '$75k–$150k', '$150k–$300k', '$300k+', 'Mixed/All']
const GEOGRAPHIC_FOCUS = ['Local (city/metro)', 'Regional (state/region)', 'National (US)', 'North America', 'Global']
const INDUSTRIES = [
  'Open to all', 'Technology (SaaS/Software)', 'Healthcare', 'Finance & Banking',
  'Retail & E-commerce', 'Real Estate', 'Manufacturing', 'Education', 'Media & Entertainment',
  'Logistics & Supply Chain', 'Energy & Utilities', 'Government/Public Sector',
  'Agriculture & Farming', 'Other (specify)',
]
const CATEGORIES = [
  'Software / App', 'Physical Product', 'Professional Service', 'Consulting',
  'Creative / Marketing', 'Health / Medical', 'Financial Service', 'Training / Education',
  'Food / Beverage', 'Other',
]

const STEPS = ['What You Offer', 'Target Customer', 'Demographics', 'Shopping Behavior', 'Review & Analyze']

export default function TargetMarketPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [customIndustry, setCustomIndustry] = useState('')
  const [result, setResult] = useState<TargetMarketResult | null>(null)
  const [stockQuotes, setStockQuotes] = useState<StockQuoteResult[]>([])
  const [stockLoading, setStockLoading] = useState(false)

  const [form, setForm] = useState<TargetMarketRequest>({
    productService: '',
    productCategory: '',
    customerType: 'b2c',
    ageRange: '25-34',
    incomeLevel: '$35k–$75k',
    interests: [],
    geographicFocus: 'National (US)',
    onlineShoppingPropensity: 'medium',
    industryPreference: 'Open to all',
    additionalContext: '',
  })

  const toggleInterest = (interest: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter(i => i !== interest)
        : [...f.interests, interest],
    }))
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const payload = {
        ...form,
        industryPreference: form.industryPreference === 'Other (specify)'
          ? (customIndustry.trim() || 'Other')
          : form.industryPreference,
      }
      const res = await fetch('/api/tools/target-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Server error (${res.status}). The analysis took too long — please try again.`)
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setStep(5)
      // Fetch live stock quotes for AI-selected picks
      if (data.stockPicks?.length) {
        setStockLoading(true)
        setStockQuotes([])
        fetch('/api/tools/stock-quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tickers: data.stockPicks.map((p: StockPick) => p.ticker) }),
        })
          .then(r => r.json())
          .then(quotes => setStockQuotes(Array.isArray(quotes) ? quotes : []))
          .catch(() => {})
          .finally(() => setStockLoading(false))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please log in to use this tool.</p>
          <button onClick={() => router.push('/auth/login')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">
            Log In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Target Market Finder - Take The Reins</title>
        <meta name="description" content="Find your ideal target market using AI-powered market analysis" />
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/hub')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">🎯 Target Market Finder</h1>
          <p className="text-slate-400 text-lg">
            Answer a few questions and our AI will identify the best companies to target —
            cross-referenced with live stock and housing market data.
          </p>
        </div>

        {/* Progress bar (only show on steps 0-4) */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((label, i) => (
                <span
                  key={i}
                  className={`text-xs font-medium ${i <= step ? 'text-indigo-400' : 'text-slate-600'}`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="h-2 bg-slate-700 rounded-full">
              <div
                className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-500/50 text-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* STEP 0: What You Offer */}
        {step === 0 && (
          <StepCard title="What are you offering?" subtitle="Tell us about your product or service">
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Describe what you want to sell or offer *
                </label>
                <textarea
                  value={form.productService}
                  onChange={e => setForm(f => ({ ...f, productService: e.target.value }))}
                  placeholder="e.g., Custom CRM software for small real estate agencies, Organic dog food subscription boxes, LinkedIn ghostwriting services for executives..."
                  rows={4}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Category</label>
                <select
                  value={form.productCategory}
                  onChange={e => setForm(f => ({ ...f, productCategory: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Customer type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['b2b', 'b2c', 'both'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setForm(f => ({ ...f, customerType: type }))}
                      className={`py-3 rounded-lg border font-medium transition ${
                        form.customerType === type
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {type === 'b2b' ? '🏢 B2B' : type === 'b2c' ? '👤 B2C' : '🔄 Both'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <NavButtons
              onNext={() => setStep(1)}
              nextDisabled={!form.productService.trim()}
            />
          </StepCard>
        )}

        {/* STEP 1: Target Customer */}
        {step === 1 && (
          <StepCard title="Who is your ideal customer?" subtitle="Help us understand the companies or people you want to reach">
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Preferred industry</label>
                <select
                  value={form.industryPreference}
                  onChange={e => setForm(f => ({ ...f, industryPreference: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500"
                >
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                {form.industryPreference === 'Other (specify)' && (
                  <input
                    type="text"
                    placeholder="e.g. Farming, Agriculture, Veterinary..."
                    value={customIndustry}
                    onChange={e => setCustomIndustry(e.target.value)}
                    className="mt-2 w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Geographic focus</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {GEOGRAPHIC_FOCUS.map(geo => (
                    <button
                      key={geo}
                      onClick={() => setForm(f => ({ ...f, geographicFocus: geo }))}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                        form.geographicFocus === geo
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Any additional context? (optional)
                </label>
                <textarea
                  value={form.additionalContext}
                  onChange={e => setForm(f => ({ ...f, additionalContext: e.target.value }))}
                  placeholder="e.g., I have 10 years in healthcare IT, I'm targeting Series A startups, I want to work with mission-driven companies..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>
            <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </StepCard>
        )}

        {/* STEP 2: Demographics */}
        {step === 2 && (
          <StepCard title="Customer demographics" subtitle="Who specifically are your end customers?">
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">Target age range</label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map(age => (
                    <button
                      key={age}
                      onClick={() => setForm(f => ({ ...f, ageRange: age }))}
                      className={`py-2 px-4 rounded-lg border text-sm font-medium transition ${
                        form.ageRange === age
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">Target income level</label>
                <div className="flex flex-wrap gap-2">
                  {INCOME_LEVELS.map(inc => (
                    <button
                      key={inc}
                      onClick={() => setForm(f => ({ ...f, incomeLevel: inc }))}
                      className={`py-2 px-4 rounded-lg border text-sm font-medium transition ${
                        form.incomeLevel === inc
                          ? 'bg-green-600 border-green-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      {inc}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">
                  Customer interests <span className="text-slate-500">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`py-1.5 px-3 rounded-full border text-sm font-medium transition ${
                        form.interests.includes(interest)
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-purple-500/50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </StepCard>
        )}

        {/* STEP 3: Shopping Behavior */}
        {step === 3 && (
          <StepCard title="Shopping behavior" subtitle="How does your customer prefer to buy?">
            <div className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-3">
                  Online shopping propensity
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['high', 'medium', 'low'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setForm(f => ({ ...f, onlineShoppingPropensity: level }))}
                      className={`py-4 rounded-lg border font-medium transition flex flex-col items-center gap-1 ${
                        form.onlineShoppingPropensity === level
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500/50'
                      }`}
                    >
                      <span className="text-2xl">{level === 'high' ? '🛒' : level === 'medium' ? '🛍️' : '🏪'}</span>
                      <span className="capitalize">{level}</span>
                      <span className="text-xs opacity-70">
                        {level === 'high' ? 'Buys primarily online' : level === 'medium' ? 'Mix of online/offline' : 'Prefers in-person'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-3">📋 Your Profile Summary</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p><span className="text-slate-500">Offering:</span> {form.productService.slice(0, 80)}{form.productService.length > 80 ? '...' : ''}</p>
                  <p><span className="text-slate-500">Category:</span> {form.productCategory || 'Not set'}</p>
                  <p><span className="text-slate-500">Customer type:</span> {form.customerType.toUpperCase()}</p>
                  <p><span className="text-slate-500">Industry target:</span> {form.industryPreference === 'Other (specify)' ? (customIndustry.trim() || 'Other') : form.industryPreference}</p>
                  <p><span className="text-slate-500">Age range:</span> {form.ageRange}</p>
                  <p><span className="text-slate-500">Income level:</span> {form.incomeLevel}</p>
                  <p><span className="text-slate-500">Interests:</span> {form.interests.join(', ') || 'None selected'}</p>
                  <p><span className="text-slate-500">Geography:</span> {form.geographicFocus}</p>
                </div>
              </div>
            </div>
            <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </StepCard>
        )}

        {/* STEP 4: Confirm & Analyze */}
        {step === 4 && (
          <StepCard title="Ready to analyze" subtitle="We'll pull live market data and run AI analysis">
            <div className="space-y-4">
              <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-5">
                <h3 className="text-indigo-300 font-semibold mb-3">🔍 What happens next:</h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">📈</span>We pull live stock market data (top gaining companies right now)</li>
                  <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">🏠</span>We check housing and real estate market signals</li>
                  <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">🤖</span>Claude AI cross-references all of this with your profile</li>
                  <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">🎯</span>You get 6-8 specific target companies with approach strategies</li>
                </ul>
              </div>
              <p className="text-slate-500 text-sm text-center">Analysis takes about 15-20 seconds</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition"
              >
                ← Back
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold rounded-lg transition"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing market data...
                  </span>
                ) : '🎯 Find My Target Market'}
              </button>
            </div>
          </StepCard>
        )}

        {/* STEP 5: Results */}
        {step === 5 && result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-indigo-900/30 border border-indigo-500/40 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-3">🎯 Your Target Market Analysis</h2>
              <p className="text-slate-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Target Persona */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">👤 Your Ideal Customer Persona</h3>
              <p className="text-slate-300 leading-relaxed">{result.targetPersona}</p>
            </div>

            {/* Company Recommendations */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">🏢 Target Companies ({result.companies?.length || 0})</h3>
              <div className="space-y-4">
                {result.companies?.map((company: CompanyRecommendation, idx: number) => (
                  <CompanyCard key={idx} company={company} rank={idx + 1} />
                ))}
              </div>
            </div>

            {/* Rising Market Leaders */}
            {result.stockPicks?.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xl font-bold text-white">📈 Rising Market Leaders</h3>
                  {stockLoading && <span className="text-slate-400 text-xs animate-pulse">Loading live prices…</span>}
                </div>
                <p className="text-slate-400 text-sm mb-4">Publicly traded companies with strong momentum in your target sector</p>
                <div className="space-y-3">
                  {result.stockPicks.map((pick: StockPick, idx: number) => {
                    const quote = stockQuotes.find(q => q.ticker === pick.ticker)
                    const up = quote?.changePercent != null && quote.changePercent >= 0
                    return (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                        <div className="min-w-[72px]">
                          <div className="text-indigo-400 font-bold text-sm">{pick.ticker}</div>
                          {!stockLoading && quote?.price != null ? (
                            <>
                              <div className="text-white text-xs font-semibold">${quote.price.toLocaleString()}</div>
                              <div className={`text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
                                {up ? '▲' : '▼'} {Math.abs(quote.changePercent!).toFixed(2)}%
                              </div>
                            </>
                          ) : !stockLoading ? (
                            <div className="text-slate-500 text-xs">N/A</div>
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-semibold">{pick.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{pick.sector}</div>
                          <div className="text-slate-300 text-xs mt-1">{pick.relevance}</div>
                          <div className="text-green-400/80 text-xs mt-1 italic">{pick.momentumReason}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-slate-500 text-xs mt-3">Prices are live market data. This is not investment advice.</p>
              </div>
            )}

            {/* Market Context */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">🏠 Housing Market Insight</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{result.housingMarketInsight}</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">📊 Economic Context</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{result.economicContext}</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">✅ Actionable Next Steps</h3>
              <ol className="space-y-3">
                {result.actionableNextSteps?.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300">
                    <span className="bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Start Over */}
            <div className="text-center pt-4">
              <button
                onClick={() => { setStep(0); setResult(null); setError(''); setStockQuotes([]); setStockLoading(false) }}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium px-6 py-3 rounded-lg transition"
              >
                🔄 Run Another Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
      <p className="text-slate-400 mb-6">{subtitle}</p>
      {children}
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled = false,
}: {
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="mt-6 flex gap-3">
      {onBack && (
        <button onClick={onBack} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg transition">
          ← Back
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          Continue →
        </button>
      )}
    </div>
  )
}

function CompanyCard({ company, rank }: { company: CompanyRecommendation; rank: number }) {
  return (
    <div className="bg-slate-800 border border-slate-700 hover:border-indigo-500/40 rounded-xl p-5 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center shrink-0">
            {rank}
          </span>
          <div>
            <h4 className="text-white font-bold text-lg">{company.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {company.ticker && company.ticker !== 'Private' && (
                <span className="bg-slate-700 text-indigo-300 text-xs font-mono px-2 py-0.5 rounded">
                  {company.ticker}
                </span>
              )}
              <span className="text-slate-500 text-xs">{company.sector}</span>
            </div>
          </div>
        </div>
        <span className="text-xs bg-green-900/40 text-green-300 border border-green-700/50 px-2 py-1 rounded-full shrink-0">
          {company.growthSignal}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-slate-500 uppercase text-xs font-semibold tracking-wide">Why it fits</span>
          <p className="text-slate-300 mt-1">{company.whyItFits}</p>
        </div>
        <div>
          <span className="text-slate-500 uppercase text-xs font-semibold tracking-wide">Market trend</span>
          <p className="text-slate-300 mt-1">{company.marketTrend}</p>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-3">
          <span className="text-indigo-400 uppercase text-xs font-semibold tracking-wide">💡 How to approach</span>
          <p className="text-slate-300 mt-1">{company.approachSuggestion}</p>
        </div>
      </div>
    </div>
  )
}
