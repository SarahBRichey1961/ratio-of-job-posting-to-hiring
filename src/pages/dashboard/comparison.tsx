import React, { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  FilterBar,
  Button,
  Select,
  Card,
  Section,
} from '@/components/DashboardUI'

interface ComparisonRow {
  name: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
}

export default function ComparisonPage() {
  const [sortBy, setSortBy] = useState<'score' | 'lifespan' | 'reposts' | 'name' | 'quality'>(
    'score'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minScore, setMinScore] = useState(0)

  const boards: ComparisonRow[] = [
    {
      name: 'Stack Overflow',
      score: 88,
      grade: 'A+',
      avgLifespan: 12,
      repostRate: 3,
      totalPostings: 2456,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 5.2,
      dataQuality: 97,
    },
    {
      name: 'LinkedIn Jobs',
      score: 85,
      grade: 'A',
      avgLifespan: 14,
      repostRate: 5,
      totalPostings: 5432,
      topRole: 'Product Manager',
      trend: 'up',
      trendValue: 3.1,
      dataQuality: 95,
    },
    {
      name: 'GitHub Jobs',
      score: 84,
      grade: 'A',
      avgLifespan: 13,
      repostRate: 4,
      totalPostings: 1834,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.8,
      dataQuality: 96,
    },
    {
      name: 'HackerNews',
      score: 82,
      grade: 'A',
      avgLifespan: 11,
      repostRate: 2,
      totalPostings: 1245,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 3.5,
      dataQuality: 94,
    },
    {
      name: 'We Work Remotely',
      score: 74,
      grade: 'B+',
      avgLifespan: 15,
      repostRate: 6,
      totalPostings: 1567,
      topRole: 'Product Manager',
      trend: 'up',
      trendValue: 4.2,
      dataQuality: 90,
    },
    {
      name: 'Indeed',
      score: 72,
      grade: 'B',
      avgLifespan: 18,
      repostRate: 12,
      totalPostings: 3200,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -2.3,
      dataQuality: 88,
    },
    {
      name: 'Glassdoor',
      score: 68,
      grade: 'B',
      avgLifespan: 20,
      repostRate: 14,
      totalPostings: 2890,
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.1,
      dataQuality: 82,
    },
    {
      name: 'Built In',
      score: 67,
      grade: 'B',
      avgLifespan: 16,
      repostRate: 7,
      totalPostings: 1200,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.5,
      dataQuality: 85,
    },
    {
      name: 'Remote Tech Jobs',
      score: 65,
      grade: 'B-',
      avgLifespan: 17,
      repostRate: 8,
      totalPostings: 567,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 3.2,
      dataQuality: 80,
    },
    {
      name: 'ZipRecruiter',
      score: 65,
      grade: 'B-',
      avgLifespan: 22,
      repostRate: 18,
      totalPostings: 3100,
      topRole: 'Sales',
      trend: 'down',
      trendValue: -1.8,
      dataQuality: 76,
    },
    {
      name: 'Remotive',
      score: 63,
      grade: 'B-',
      avgLifespan: 16,
      repostRate: 8,
      totalPostings: 1034,
      topRole: 'Customer Support',
      trend: 'stable',
      trendValue: 0.5,
      dataQuality: 87,
    },
    {
      name: 'RemoteOK',
      score: 62,
      grade: 'C+',
      avgLifespan: 17,
      repostRate: 9,
      totalPostings: 892,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.1,
      dataQuality: 80,
    },
    {
      name: 'The Muse',
      score: 60,
      grade: 'C+',
      avgLifespan: 19,
      repostRate: 11,
      totalPostings: 756,
      topRole: 'Product Manager',
      trend: 'stable',
      trendValue: -0.3,
      dataQuality: 78,
    },
    {
      name: 'CareerBuilder',
      score: 58,
      grade: 'C',
      avgLifespan: 24,
      repostRate: 16,
      totalPostings: 2345,
      topRole: 'Sales',
      trend: 'down',
      trendValue: -3.2,
      dataQuality: 74,
    },
    {
      name: 'Hired',
      score: 57,
      grade: 'C',
      avgLifespan: 14,
      repostRate: 7,
      totalPostings: 567,
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.8,
      dataQuality: 92,
    },
    {
      name: 'FlexJobs',
      score: 56,
      grade: 'C',
      avgLifespan: 18,
      repostRate: 5,
      totalPostings: 423,
      topRole: 'Virtual Assistant',
      trend: 'stable',
      trendValue: 1.2,
      dataQuality: 89,
    },
    {
      name: 'AngelList',
      score: 54,
      grade: 'C',
      avgLifespan: 12,
      repostRate: 4,
      totalPostings: 234,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -2.5,
      dataQuality: 81,
    },
    {
      name: 'WellFound',
      score: 53,
      grade: 'C',
      avgLifespan: 14,
      repostRate: 6,
      totalPostings: 456,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 1.8,
      dataQuality: 79,
    },
    {
      name: 'Remote.co',
      score: 52,
      grade: 'D',
      avgLifespan: 21,
      repostRate: 13,
      totalPostings: 345,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -1.9,
      dataQuality: 72,
    },
    {
      name: 'Dribbble Jobs',
      score: 51,
      grade: 'D',
      avgLifespan: 16,
      repostRate: 10,
      totalPostings: 234,
      topRole: 'UI Designer',
      trend: 'stable',
      trendValue: 0.3,
      dataQuality: 70,
    },
    {
      name: 'Idealist.org',
      score: 49,
      grade: 'D',
      avgLifespan: 26,
      repostRate: 19,
      totalPostings: 567,
      topRole: 'Program Manager',
      trend: 'down',
      trendValue: -2.1,
      dataQuality: 65,
    },
    {
      name: 'Virtual Vocations',
      score: 47,
      grade: 'D',
      avgLifespan: 23,
      repostRate: 15,
      totalPostings: 289,
      topRole: 'Virtual Assistant',
      trend: 'down',
      trendValue: -0.8,
      dataQuality: 61,
    },
    {
      name: 'Crunchboard',
      score: 45,
      grade: 'F',
      avgLifespan: 20,
      repostRate: 22,
      totalPostings: 189,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -3.4,
      dataQuality: 58,
    },
    {
      name: 'Dice',
      score: 44,
      grade: 'F',
      avgLifespan: 25,
      repostRate: 24,
      totalPostings: 1234,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -4.2,
      dataQuality: 54,
    },
    {
      name: 'ProBlogger',
      score: 42,
      grade: 'F',
      avgLifespan: 19,
      repostRate: 17,
      totalPostings: 145,
      topRole: 'Content Writer',
      trend: 'down',
      trendValue: -1.6,
      dataQuality: 51,
    },
    {
      name: 'Design Observer',
      score: 41,
      grade: 'F',
      avgLifespan: 18,
      repostRate: 12,
      totalPostings: 89,
      topRole: 'Designer',
      trend: 'stable',
      trendValue: -0.2,
      dataQuality: 49,
    },
    {
      name: 'Blind',
      score: 39,
      grade: 'F',
      avgLifespan: 8,
      repostRate: 4,
      totalPostings: 67,
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 1.3,
      dataQuality: 45,
    },
    {
      name: 'Data Jobs',
      score: 43,
      grade: 'F',
      avgLifespan: 21,
      repostRate: 16,
      totalPostings: 234,
      topRole: 'Data Scientist',
      trend: 'stable',
      trendValue: -0.4,
      dataQuality: 52,
    },
    {
      name: 'Geekwork',
      score: 39,
      grade: 'F',
      avgLifespan: 19,
      repostRate: 14,
      totalPostings: 123,
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -1.2,
      dataQuality: 48,
    },
    {
      name: 'iCrunchData',
      score: 38,
      grade: 'F',
      avgLifespan: 20,
      repostRate: 15,
      totalPostings: 89,
      topRole: 'Data Scientist',
      trend: 'down',
      trendValue: -0.8,
      dataQuality: 46,
    },
    {
      name: 'EnvironmentalCareer.com',
      score: 37,
      grade: 'F',
      avgLifespan: 22,
      repostRate: 18,
      totalPostings: 123,
      topRole: 'Environmental Officer',
      trend: 'down',
      trendValue: -0.9,
      dataQuality: 43,
    },
    {
      name: 'Monster',
      score: 35,
      grade: 'F',
      avgLifespan: 28,
      repostRate: 26,
      totalPostings: 4567,
      topRole: 'Sales',
      trend: 'down',
      trendValue: -5.1,
      dataQuality: 38,
    },
    {
      name: 'Mediabistro',
      score: 32,
      grade: 'F',
      avgLifespan: 24,
      repostRate: 20,
      totalPostings: 156,
      topRole: 'Journalist',
      trend: 'down',
      trendValue: -2.3,
      dataQuality: 40,
    },
    {
      name: 'Reddit /r/sysadminjobs',
      score: 29,
      grade: 'F',
      avgLifespan: 25,
      repostRate: 28,
      totalPostings: 78,
      topRole: 'System Admin',
      trend: 'down',
      trendValue: -1.5,
      dataQuality: 35,
    },
    {
      name: 'CraigsList',
      score: 28,
      grade: 'F',
      avgLifespan: 30,
      repostRate: 35,
      totalPostings: 5234,
      topRole: 'General Labor',
      trend: 'down',
      trendValue: -6.8,
      dataQuality: 32,
    },
    {
      name: 'Microsoft',
      score: 27,
      grade: 'F',
      avgLifespan: 35,
      repostRate: 22,
      totalPostings: 25000,
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.2,
      dataQuality: 88,
    },
  ]

  const filtered = useMemo(() => {
    let result = boards.filter((b) => b.score >= minScore)
    result.sort((a, b) => {
      let aVal: any = 0,
        bVal: any = 0
      switch (sortBy) {
        case 'score':
          aVal = a.score
          bVal = b.score
          break
        case 'lifespan':
          aVal = a.avgLifespan
          bVal = b.avgLifespan
          break
        case 'reposts':
          aVal = a.repostRate
          bVal = b.repostRate
          break
        case 'quality':
          aVal = a.dataQuality
          bVal = b.dataQuality
          break
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    return result
  }, [sortBy, sortOrder, minScore])

  return (
    <DashboardLayout>
      <PageHeader title="Board Comparison" description="Compare efficiency scores across all job boards" />
      <Section title="Board Rankings">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-gray-200">Board</th>
                <th className="text-center py-3 px-4 text-gray-200">Score</th>
                <th className="text-center py-3 px-4 text-gray-200">Grade</th>
                <th className="text-center py-3 px-4 text-gray-200">Lifespan</th>
                <th className="text-center py-3 px-4 text-gray-200">Reposts</th>
                <th className="text-center py-3 px-4 text-gray-200">Quality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.name} className="border-b border-gray-800">
                  <td className="py-4 px-4 text-gray-300">{b.name}</td>
                  <td className="text-center py-4 px-4 text-white font-bold">{b.score}</td>
                  <td className="text-center py-4 px-4 text-white">{b.grade}</td>
                  <td className="text-center py-4 px-4 text-gray-400">{b.avgLifespan}d</td>
                  <td className="text-center py-4 px-4 text-gray-400">{b.repostRate}%</td>
                  <td className="text-center py-4 px-4 text-green-400">{b.dataQuality}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </DashboardLayout>
  )
}
