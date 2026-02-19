import React from 'react'
import { EfficiencyScore, ScoreComponentBreakdown, RoleScoreMetrics } from '@/lib/scoringEngine'

interface ScoreCardProps {
  score: EfficiencyScore & { rank?: number; grade?: string }
}

export function ScoreCard({ score }: ScoreCardProps) {
  const gradeColor = {
    'A+': 'text-green-700 bg-green-100',
    A: 'text-green-600 bg-green-50',
    'B+': 'text-blue-600 bg-blue-50',
    B: 'text-blue-500 bg-blue-50',
    'C+': 'text-yellow-600 bg-yellow-50',
    C: 'text-orange-600 bg-orange-50',
    D: 'text-red-600 bg-red-50',
    F: 'text-red-700 bg-red-100',
  }

  const gradeClass = gradeColor[score.grade as keyof typeof gradeColor] || ''

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {score.rank && `#${score.rank} `}
            {score.boardName}
          </h3>
          {score.rank && (
            <p className="text-sm text-gray-500">
              Percentile: {score.percentile}th
            </p>
          )}
        </div>
        {score.grade && (
          <div className={`text-4xl font-bold ${gradeClass} px-4 py-2 rounded-lg`}>
            {score.grade}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Overall Score</p>
        <div className="flex items-end gap-2">
          <p className="text-5xl font-bold text-gray-900">{score.overallScore}</p>
          <p className="text-sm text-gray-500 mb-2">/ 100</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Lifespan Score (40%):</span>
          <span className="font-semibold">{score.lifespanScore}/100</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Repost Score (30%):</span>
          <span className="font-semibold">{score.repostScore}/100</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Employer Survey (20%):</span>
          <span className="font-semibold">{score.employerSurveyScore}/100</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Candidate Survey (10%):</span>
          <span className="font-semibold">{score.candidateSurveyScore}/100</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quality Adjustment:</span>
          <span className="font-semibold">{(score.qualityAdjustment * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data Completeness:</span>
          <span className="font-semibold">
            {(score.dataCompletenessRatio * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

interface RankingProps {
  scores: Array<EfficiencyScore & { rank: number; grade: string }>
}

export function ScoresRanking({ scores }: RankingProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Board Rankings by Efficiency
      </h3>

      {scores.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-500">No scores available yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((score) => (
            <div
              key={score.boardId}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                  {score.rank}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{score.boardName}</p>
                  <p className="text-xs text-gray-500">
                    {(score.dataCompletenessRatio * 100).toFixed(0)}% data complete
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{score.overallScore}</p>
                  <p className="text-xs text-gray-500">score</p>
                </div>
                <div className="text-3xl font-bold text-gray-700">{score.grade}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ComponentBreakdownProps {
  breakdown: ScoreComponentBreakdown
  boardName: string
}

export function ComponentBreakdown({ breakdown, boardName }: ComponentBreakdownProps) {
  const components = [
    {
      label: 'Lifespan (40%)',
      score: breakdown.lifespan.score,
      contribution: breakdown.lifespan.contribution,
      color: 'bg-blue-500',
    },
    {
      label: 'Reposts (30%)',
      score: breakdown.reposts.score,
      contribution: breakdown.reposts.contribution,
      color: 'bg-orange-500',
    },
    {
      label: 'Employer Surveys (20%)',
      score: breakdown.employerSurvey.score,
      contribution: breakdown.employerSurvey.contribution,
      color: 'bg-green-500',
    },
    {
      label: 'Candidate Surveys (10%)',
      score: breakdown.candidateSurvey.score,
      contribution: breakdown.candidateSurvey.contribution,
      color: 'bg-purple-500',
    },
  ]

  const total = components.reduce((sum, c) => sum + c.contribution, 0)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Score Breakdown - {boardName}
      </h3>

      <div className="space-y-4">
        {components.map((component) => (
          <div key={component.label}>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {component.label}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {component.score.toFixed(1)} ({component.contribution.toFixed(1)} pts)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${component.color} h-2 rounded-full`}
                style={{ width: `${(component.score / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">Total Contribution</span>
          <span className="font-bold text-gray-900">{total.toFixed(1)}/100</span>
        </div>
      </div>
    </div>
  )
}

interface RoleScoresTableProps {
  data: RoleScoreMetrics[]
}

export function RoleScoresTable({ data }: RoleScoresTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Average Score by Role Family
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Role Family
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Avg Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Median
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Jobs
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Best Board
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((role, idx) => (
              <tr
                key={role.roleFamily}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {role.roleFamily}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-blue-600">
                  {role.avgScore}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.medianScore}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.jobCount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.bestBoard}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ScoreComparisonProps {
  board1: EfficiencyScore | null
  board2: EfficiencyScore | null
}

export function ScoreComparison({ board1, board2 }: ScoreComparisonProps) {
  if (!board1 || !board2) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">Unable to load comparison data</p>
      </div>
    )
  }

  const difference = board1.overallScore - board2.overallScore
  const winner = difference > 0 ? board1.boardName : board2.boardName

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {board1.boardName}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Score:</span>
            <span className="font-bold text-3xl text-gray-900">
              {board1.overallScore}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Lifespan:</span>
            <span className="text-sm font-semibold">{board1.lifespanScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reposts:</span>
            <span className="text-sm font-semibold">{board1.repostScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Data Complete:</span>
            <span className="text-sm font-semibold">
              {(board1.dataCompletenessRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {board2.boardName}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Overall Score:</span>
            <span className="font-bold text-3xl text-gray-900">
              {board2.overallScore}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Lifespan:</span>
            <span className="text-sm font-semibold">{board2.lifespanScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reposts:</span>
            <span className="text-sm font-semibold">{board2.repostScore}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Data Complete:</span>
            <span className="text-sm font-semibold">
              {(board2.dataCompletenessRatio * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Difference</p>
        <p className="text-3xl font-bold text-blue-600">
          {Math.abs(difference)} points
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {winner} is {Math.abs(difference)} points more efficient
        </p>
      </div>
    </div>
  )
}
