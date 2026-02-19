import React, { useState } from 'react'
import { normalizeJobTitle, getRoleFamilies, RoleFamily } from '@/lib/titleNormalization'

export interface TitleNormalizerProps {
  onNormalize?: (original: string, normalized: RoleFamily) => void
}

export function TitleNormalizer({ onNormalize }: TitleNormalizerProps) {
  const [title, setTitle] = useState('')
  const [normalized, setNormalized] = useState<RoleFamily | null>(null)
  const [showExamples, setShowExamples] = useState(false)

  const handleNormalize = () => {
    if (title.trim()) {
      const result = normalizeJobTitle(title)
      setNormalized(result)
      onNormalize?.(title, result)
    }
  }

  const roleFamilies = getRoleFamilies()
  const colors: Record<RoleFamily, string> = {
    'software-engineer': 'bg-blue-100 text-blue-800',
    'data-scientist': 'bg-purple-100 text-purple-800',
    'product-manager': 'bg-green-100 text-green-800',
    designer: 'bg-pink-100 text-pink-800',
    'devops-infrastructure': 'bg-orange-100 text-orange-800',
    'qa-testing': 'bg-red-100 text-red-800',
    'business-analyst': 'bg-yellow-100 text-yellow-800',
    sales: 'bg-indigo-100 text-indigo-800',
    marketing: 'bg-cyan-100 text-cyan-800',
    operations: 'bg-teal-100 text-teal-800',
    finance: 'bg-emerald-100 text-emerald-800',
    hr: 'bg-rose-100 text-rose-800',
    executive: 'bg-gray-100 text-gray-800',
    other: 'bg-slate-100 text-slate-800',
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Title Normalizer</h2>

      <div className="space-y-4">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNormalize()}
            placeholder="e.g., Senior Software Engineer, Data Scientist, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleNormalize}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Normalize
        </button>

        {/* Result */}
        {normalized && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Normalized Role Family:</p>
            <div
              className={`inline-block px-4 py-2 rounded-full font-semibold ${colors[normalized]}`}
            >
              {normalized.replace(/-/g, ' ').toUpperCase()}
            </div>
          </div>
        )}

        {/* Examples Toggle */}
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showExamples ? '▼' : '▶'} Show Examples
        </button>

        {/* Examples */}
        {showExamples && (
          <div className="space-y-3 pt-2 border-t border-gray-200">
            {roleFamilies.map((role) => (
              <div key={role.family}>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  <span className={`px-2 py-1 rounded ${colors[role.family]}`}>
                    {role.family.replace(/-/g, ' ').toUpperCase()}
                  </span>
                </p>
                <div className="space-y-1 ml-4">
                  {role.keywords.slice(0, 5).map((keyword) => (
                    <p key={keyword} className="text-sm text-gray-600">
                      • {keyword}
                    </p>
                  ))}
                  {role.keywords.length > 5 && (
                    <p className="text-sm text-gray-500">
                      + {role.keywords.length - 5} more keywords
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function RoleFamilyOverview() {
  const roleFamilies = getRoleFamilies()

  const colors: Record<RoleFamily, string> = {
    'software-engineer': 'bg-blue-50 border-blue-200',
    'data-scientist': 'bg-purple-50 border-purple-200',
    'product-manager': 'bg-green-50 border-green-200',
    designer: 'bg-pink-50 border-pink-200',
    'devops-infrastructure': 'bg-orange-50 border-orange-200',
    'qa-testing': 'bg-red-50 border-red-200',
    'business-analyst': 'bg-yellow-50 border-yellow-200',
    sales: 'bg-indigo-50 border-indigo-200',
    marketing: 'bg-cyan-50 border-cyan-200',
    operations: 'bg-teal-50 border-teal-200',
    finance: 'bg-emerald-50 border-emerald-200',
    hr: 'bg-rose-50 border-rose-200',
    executive: 'bg-gray-50 border-gray-200',
    other: 'bg-slate-50 border-slate-200',
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Role Family Reference</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleFamilies.map((role) => (
          <div
            key={role.family}
            className={`p-4 rounded-lg border ${colors[role.family]}`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">
              {role.family.replace(/-/g, ' ').toUpperCase()}
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Keywords:</p>
                <p className="text-sm text-gray-700">
                  {role.keywords.slice(0, 3).join(', ')}
                  {role.keywords.length > 3 && '...'}
                </p>
              </div>
              {role.aliases.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Aliases:</p>
                  <p className="text-sm text-gray-700">{role.aliases.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
