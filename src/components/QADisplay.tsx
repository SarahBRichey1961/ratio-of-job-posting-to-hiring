import React from 'react'
import { QASummary, QAResult } from '@/lib/qaValidator'

interface QAStatusBarProps {
  summary: QASummary
}

export function QAStatusBar({ summary }: QAStatusBarProps) {
  const statusColor =
    summary.criticalIssues > 0
      ? 'bg-red-50 border-red-200'
      : summary.failed > 0
      ? 'bg-orange-50 border-orange-200'
      : summary.warnings > 0
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-green-50 border-green-200'

  const statusIcon =
    summary.criticalIssues > 0
      ? '🔴'
      : summary.failed > 0
      ? '🟠'
      : summary.warnings > 0
      ? '🟡'
      : '✅'

  const statusText =
    summary.criticalIssues > 0
      ? 'CRITICAL ISSUES FOUND'
      : summary.failed > 0
      ? 'FAILURES DETECTED'
      : summary.warnings > 0
      ? 'WARNINGS PRESENT'
      : 'ALL CHECKS PASSED'

  return (
    <div className={`border rounded-lg p-6 ${statusColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">QA Validation Results</h2>
        <span className="text-4xl">{statusIcon}</span>
      </div>

      <p className="text-lg font-semibold text-gray-900 mb-4">{statusText}</p>

      <div className="grid grid-cols-5 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Tests</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalTests}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Passed</p>
          <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.warnings}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Success Rate</p>
          <p className="text-2xl font-bold text-blue-600">{summary.successRate.toFixed(1)}%</p>
        </div>
      </div>

      {summary.criticalIssues > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-sm font-semibold text-red-900">
            ⚠️ {summary.criticalIssues} critical issue(s) require attention before frontend launch
          </p>
        </div>
      )}
    </div>
  )
}

interface QAResultItemProps {
  result: QAResult
}

export function QAResultItem({ result }: QAResultItemProps) {
  const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  const statusColor =
    result.status === 'pass'
      ? 'bg-green-50 border-green-200'
      : result.status === 'fail'
      ? 'bg-red-50 border-red-200'
      : 'bg-yellow-50 border-yellow-200'

  const severityLabel =
    result.severity === 'critical'
      ? '🔴 CRITICAL'
      : result.severity === 'major'
      ? '🟠 MAJOR'
      : '🟡 MINOR'

  return (
    <div className={`border rounded-lg p-4 ${statusColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{statusIcon}</span>
          <h4 className="font-semibold text-gray-900">{result.test}</h4>
        </div>
        <span className="text-xs font-bold">{severityLabel}</span>
      </div>

      <p className="text-sm text-gray-700 mb-2">{result.message}</p>

      {result.details && (
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(result.details, null, 2)}
        </pre>
      )}
    </div>
  )
}

interface QAResultsTableProps {
  results: QAResult[]
}

export function QAResultsTable({ results }: QAResultsTableProps) {
  const grouped: Record<string, QAResult[]> = {}

  results.forEach((result) => {
    const category = result.test.split(':')[0]
    if (!grouped[category]) grouped[category] = []
    grouped[category].push(result)
  })

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryResults]) => {
        const passed = categoryResults.filter((r) => r.status === 'pass').length
        const failed = categoryResults.filter((r) => r.status === 'fail').length
        const warned = categoryResults.filter((r) => r.status === 'warning').length

        return (
          <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category}</h3>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-semibold">✅ {passed}</span>
                <span className="text-red-600 font-semibold">❌ {failed}</span>
                <span className="text-yellow-600 font-semibold">⚠️ {warned}</span>
              </div>
            </div>

            <div className="space-y-2 p-4">
              {categoryResults.map((result) => (
                <QAResultItem key={result.test} result={result} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface QARoadmapProps {
  summary: QASummary
}

export function QARoadmap({ summary }: QARoadmapProps) {
  const criticalFixes = summary.results.filter(
    (r) => r.status === 'fail' && r.severity === 'critical'
  )
  const majorFixes = summary.results.filter((r) => r.status === 'fail' && r.severity === 'major')
  const minorFixes = summary.results.filter((r) => r.status === 'fail' && r.severity === 'minor')

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-600 mb-4">🔴 Critical Fixes ({criticalFixes.length})</h3>
        <p className="text-sm text-gray-600 mb-3">Must fix before frontend launch</p>
        <div className="space-y-2">
          {criticalFixes.slice(0, 3).map((fix) => (
            <p key={fix.test} className="text-sm text-gray-900 font-medium">
              • {fix.test}
            </p>
          ))}
          {criticalFixes.length > 3 && (
            <p className="text-xs text-gray-500">+{criticalFixes.length - 3} more</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-orange-600 mb-4">🟠 Major Fixes ({majorFixes.length})</h3>
        <p className="text-sm text-gray-600 mb-3">Should fix before launch</p>
        <div className="space-y-2">
          {majorFixes.slice(0, 3).map((fix) => (
            <p key={fix.test} className="text-sm text-gray-900 font-medium">
              • {fix.test}
            </p>
          ))}
          {majorFixes.length > 3 && (
            <p className="text-xs text-gray-500">+{majorFixes.length - 3} more</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-600 mb-4">🟡 Minor Fixes ({minorFixes.length})</h3>
        <p className="text-sm text-gray-600 mb-3">Can fix in iteration 2</p>
        <div className="space-y-2">
          {minorFixes.slice(0, 3).map((fix) => (
            <p key={fix.test} className="text-sm text-gray-900 font-medium">
              • {fix.test}
            </p>
          ))}
          {minorFixes.length > 3 && (
            <p className="text-xs text-gray-500">+{minorFixes.length - 3} more</p>
          )}
        </div>
      </div>
    </div>
  )
}
