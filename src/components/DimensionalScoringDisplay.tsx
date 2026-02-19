import React from 'react'
import { RoleScore, IndustryScore, RolePerBoardScore } from '@/lib/dimensionalScoring'

interface RoleScoresTableProps {
  data: RoleScore[]
}

export function RoleScoresTable({ data }: RoleScoresTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Scores by Role Family
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Avg Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Median
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Best Board
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Jobs
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Boards
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
                  {role.bestBoard.name} ({role.bestBoard.score})
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.jobCount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {role.boards}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface IndustryScoresCardProps {
  industries: IndustryScore[]
}

export function IndustryScoresCards({ industries }: IndustryScoresCardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {industries.map((industry) => (
        <div
          key={industry.industry}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {industry.industry}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{industry.description}</p>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Score:</span>
              <span className="font-bold text-2xl text-blue-600">
                {industry.avgScore}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Boards:</span>
              <span className="font-semibold">{industry.boardCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jobs Listed:</span>
              <span className="font-semibold">{industry.jobCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Top Role:</span>
              <span className="font-semibold">{industry.topRole}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Top Boards:</p>
            <div className="space-y-1">
              {industry.boards.slice(0, 3).map((board) => (
                <div key={board.id} className="flex justify-between text-xs">
                  <span className="text-gray-600">{board.name}</span>
                  <span className="font-semibold text-blue-600">{board.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface RoleDetaillsTableProps {
  role: string
  boards: RolePerBoardScore[]
}

export function RoleDetailsTable({ role, boards }: RoleDetaillsTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Best Boards for {role}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Board Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Overall Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Postings
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Avg Lifespan
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                Repost Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {boards.map((board, idx) => (
              <tr
                key={board.boardId}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {board.boardName}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-blue-600">
                  {board.score} [{board.grade}]
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {board.jobCount}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {board.avgLifespan}d
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {board.avgRepostRate}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface HiringDemandProps {
  data: Array<{
    roleFamily: string
    jobCount: number
    newJobsPerDay: number
    repostRate: number
    demandLevel: 'High' | 'Medium' | 'Low'
  }>
}

export function HiringDemandChart({ data }: HiringDemandProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {['High', 'Medium', 'Low'].map((level) => {
        const roles = data.filter((r) => r.demandLevel === level)
        return (
          <div
            key={level}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {level} Demand Roles
            </h3>

            {roles.length === 0 ? (
              <p className="text-gray-500 text-sm">No roles in this category</p>
            ) : (
              <div className="space-y-2">
                {roles.slice(0, 5).map((role) => (
                  <div key={role.roleFamily} className="text-sm border-b border-gray-100 pb-2">
                    <p className="font-medium text-gray-900">
                      {role.roleFamily}
                    </p>
                    <p className="text-xs text-gray-500">
                      {role.jobCount} jobs, {role.newJobsPerDay}/day
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface RecommendationCardProps {
  role: string
  avgScore: number
  recommendation: string
}

export function RecommendationCard({
  role,
  avgScore,
  recommendation,
}: RecommendationCardProps) {
  const scoreColor =
    avgScore >= 80
      ? 'text-green-600 bg-green-50'
      : avgScore >= 60
      ? 'text-blue-600 bg-blue-50'
      : 'text-orange-600 bg-orange-50'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-lg font-semibold text-gray-900">{role}</h4>
        <span
          className={`font-bold text-lg px-3 py-1 rounded ${scoreColor}`}
        >
          {avgScore}
        </span>
      </div>
      <p className="text-gray-600 text-sm">{recommendation}</p>
    </div>
  )
}
