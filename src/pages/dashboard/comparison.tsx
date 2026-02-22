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
  industry: 'Tech' | 'General' | 'Remote' | 'Niche'
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
  affiliateUrl: string
}

export default function ComparisonPage() {
  const [sortBy, setSortBy] = useState<'score' | 'lifespan' | 'reposts' | 'name' | 'quality'>(
    'score'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minScore, setMinScore] = useState(0)
  const [selectedRole, setSelectedRole] = useState<string>('All Roles')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All Industries')

  const boards: ComparisonRow[] = [
    {
      name: 'Stack Overflow',
      score: 88,
      grade: 'A+',
      avgLifespan: 12,
      repostRate: 3,
      totalPostings: 2456,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 5.2,
      dataQuality: 97,
      affiliateUrl: 'https://stackoverflow.com/jobs',
    },
    {
      name: 'LinkedIn Jobs',
      score: 85,
      grade: 'A',
      avgLifespan: 14,
      repostRate: 5,
      totalPostings: 5432,
      industry: 'General',
      topRole: 'Product Manager',
      trend: 'up',
      trendValue: 3.1,
      dataQuality: 95,
      affiliateUrl: 'https://www.linkedin.com/jobs',
    },
    {
      name: 'GitHub Jobs',
      score: 84,
      grade: 'A',
      avgLifespan: 13,
      repostRate: 4,
      totalPostings: 1834,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.8,
      dataQuality: 96,
      affiliateUrl: 'https://github.com/jobs',
    },
    {
      name: 'HackerNews',
      score: 82,
      grade: 'A',
      avgLifespan: 11,
      repostRate: 2,
      totalPostings: 1245,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 3.5,
      dataQuality: 94,
      affiliateUrl: 'https://news.ycombinator.com/jobs',
    },
    {
      name: 'We Work Remotely',
      score: 74,
      grade: 'B+',
      avgLifespan: 15,
      repostRate: 6,
      totalPostings: 1567,
      industry: 'Remote',
      topRole: 'Product Manager',
      trend: 'up',
      trendValue: 4.2,
      dataQuality: 90,
      affiliateUrl: 'https://www.weworkremotely.com',
    },
    {
      name: 'Indeed',
      score: 72,
      grade: 'B',
      avgLifespan: 18,
      repostRate: 12,
      totalPostings: 3200,
      industry: 'General',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -2.3,
      dataQuality: 88,
      affiliateUrl: 'https://www.indeed.com/jobs',
    },
    {
      name: 'Glassdoor',
      score: 68,
      grade: 'B',
      avgLifespan: 20,
      repostRate: 14,
      totalPostings: 2890,
      industry: 'General',
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.1,
      dataQuality: 82,
      affiliateUrl: 'https://www.glassdoor.com/Job/index.htm',
    },
    {
      name: 'Built In',
      score: 67,
      grade: 'B',
      avgLifespan: 16,
      repostRate: 7,
      totalPostings: 1200,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.5,
      dataQuality: 85,
      affiliateUrl: 'https://builtin.com/jobs',
    },
    {
      name: 'Remote Tech Jobs',
      score: 65,
      grade: 'B-',
      avgLifespan: 17,
      repostRate: 8,
      totalPostings: 567,
      industry: 'Remote',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 3.2,
      dataQuality: 80,
      affiliateUrl: 'https://www.remotetechjobs.com',
    },
    {
      name: 'ZipRecruiter',
      score: 65,
      grade: 'B-',
      avgLifespan: 22,
      repostRate: 18,
      totalPostings: 3100,
      industry: 'General',
      topRole: 'Sales',
      trend: 'down',
      trendValue: -1.8,
      dataQuality: 76,
      affiliateUrl: 'https://www.ziprecruiter.com/Jobs',
    },
    {
      name: 'Remotive',
      score: 63,
      grade: 'B-',
      avgLifespan: 16,
      repostRate: 8,
      totalPostings: 1034,
      industry: 'Remote',
      topRole: 'Customer Support',
      trend: 'stable',
      trendValue: 0.5,
      dataQuality: 87,
      affiliateUrl: 'https://remotive.com',
    },
    {
      name: 'RemoteOK',
      score: 62,
      grade: 'C+',
      avgLifespan: 17,
      repostRate: 9,
      totalPostings: 892,
      industry: 'Remote',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 2.1,
      dataQuality: 80,
      affiliateUrl: 'https://remoteok.com',
    },
    {
      name: 'The Muse',
      score: 60,
      grade: 'C+',
      avgLifespan: 19,
      repostRate: 11,
      totalPostings: 756,
      industry: 'General',
      topRole: 'Product Manager',
      trend: 'stable',
      trendValue: -0.3,
      dataQuality: 78,
      affiliateUrl: 'https://www.themuse.com/jobs',
    },
    {
      name: 'CareerBuilder',
      score: 58,
      grade: 'C',
      avgLifespan: 24,
      repostRate: 16,
      totalPostings: 2345,
      industry: 'General',
      topRole: 'Sales',
      trend: 'down',
      trendValue: -3.2,
      dataQuality: 74,
      affiliateUrl: 'https://www.careerbuilder.com',
    },
    {
      name: 'Hired',
      score: 57,
      grade: 'C',
      avgLifespan: 14,
      repostRate: 7,
      totalPostings: 567,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.8,
      dataQuality: 92,
      affiliateUrl: 'https://hired.com',
    },
    {
      name: 'FlexJobs',
      score: 56,
      grade: 'C',
      avgLifespan: 18,
      repostRate: 5,
      totalPostings: 423,
      industry: 'Remote',
      topRole: 'Virtual Assistant',
      trend: 'stable',
      trendValue: 1.2,
      dataQuality: 89,
      affiliateUrl: 'https://www.flexjobs.com',
    },
    {
      name: 'AngelList',
      score: 54,
      grade: 'C',
      avgLifespan: 12,
      repostRate: 4,
      totalPostings: 234,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -2.5,
      dataQuality: 81,
      affiliateUrl: 'https://www.angellist.com',
    },
    {
      name: 'WellFound',
      score: 53,
      grade: 'C',
      avgLifespan: 14,
      repostRate: 6,
      totalPostings: 456,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 1.8,
      dataQuality: 79,
      affiliateUrl: 'https://wellfound.com',
    },
    {
      name: 'Remote.co',
      score: 52,
      grade: 'D',
      avgLifespan: 21,
      repostRate: 13,
      totalPostings: 345,
      industry: 'Remote',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -1.9,
      dataQuality: 72,
      affiliateUrl: 'https://remote.co/remote-jobs',
    },
    {
      name: 'Dribbble Jobs',
      score: 51,
      grade: 'D',
      avgLifespan: 16,
      repostRate: 10,
      totalPostings: 234,
      industry: 'Tech',
      topRole: 'UI Designer',
      trend: 'stable',
      trendValue: 0.3,
      dataQuality: 70,
      affiliateUrl: 'https://dribbble.com/jobs',
    },
    {
      name: 'Idealist.org',
      score: 49,
      grade: 'D',
      avgLifespan: 26,
      repostRate: 19,
      totalPostings: 567,
      industry: 'Niche',
      topRole: 'Program Manager',
      trend: 'down',
      trendValue: -2.1,
      dataQuality: 65,
      affiliateUrl: 'https://www.idealist.org/en/jobs',
    },
    {
      name: 'Virtual Vocations',
      score: 47,
      grade: 'D',
      avgLifespan: 23,
      repostRate: 15,
      totalPostings: 289,
      industry: 'Remote',
      topRole: 'Virtual Assistant',
      trend: 'down',
      trendValue: -0.8,
      dataQuality: 61,
      affiliateUrl: 'https://www.virtualvocations.com',
    },
    {
      name: 'Crunchboard',
      score: 45,
      grade: 'F',
      avgLifespan: 20,
      repostRate: 22,
      totalPostings: 189,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -3.4,
      dataQuality: 58,
      affiliateUrl: 'https://crunchboard.com',
    },
    {
      name: 'Dice',
      score: 44,
      grade: 'F',
      avgLifespan: 25,
      repostRate: 24,
      totalPostings: 1234,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -4.2,
      dataQuality: 54,
      affiliateUrl: 'https://www.dice.com',
    },
    {
      name: 'ProBlogger',
      score: 42,
      grade: 'F',
      avgLifespan: 19,
      repostRate: 17,
      totalPostings: 145,
      industry: 'Niche',
      topRole: 'Content Writer',
      trend: 'down',
      trendValue: -1.6,
      dataQuality: 51,
      affiliateUrl: 'https://problogger.com/jobs',
    },
    {
      name: 'Design Observer',
      score: 41,
      grade: 'F',
      avgLifespan: 18,
      repostRate: 12,
      totalPostings: 89,
      industry: 'Niche',
      topRole: 'Designer',
      trend: 'stable',
      trendValue: -0.2,
      dataQuality: 49,
      affiliateUrl: 'https://designobserver.com/jobs',
    },
    {
      name: 'Blind',
      score: 39,
      grade: 'F',
      avgLifespan: 8,
      repostRate: 4,
      totalPostings: 67,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'up',
      trendValue: 1.3,
      dataQuality: 45,
      affiliateUrl: 'https://www.teamblind.com/jobs',
    },
    {
      name: 'Data Jobs',
      score: 43,
      grade: 'F',
      avgLifespan: 21,
      repostRate: 16,
      totalPostings: 234,
      industry: 'Niche',
      topRole: 'Data Scientist',
      trend: 'stable',
      trendValue: -0.4,
      dataQuality: 52,
      affiliateUrl: 'https://datajobs.com',
    },
    {
      name: 'Geekwork',
      score: 39,
      grade: 'F',
      avgLifespan: 19,
      repostRate: 14,
      totalPostings: 123,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'down',
      trendValue: -1.2,
      dataQuality: 48,
      affiliateUrl: 'https://www.geekwork.com',
    },
    {
      name: 'iCrunchData',
      score: 38,
      grade: 'F',
      avgLifespan: 20,
      repostRate: 15,
      totalPostings: 89,
      industry: 'Niche',
      topRole: 'Data Scientist',
      trend: 'down',
      trendValue: -0.8,
      dataQuality: 46,
      affiliateUrl: 'https://www.icrunchdata.com',
    },
    {
      name: 'EnvironmentalCareer.com',
      score: 37,
      grade: 'F',
      avgLifespan: 22,
      repostRate: 18,
      totalPostings: 123,
      industry: 'Niche',
      topRole: 'Environmental Officer',
      trend: 'down',
      trendValue: -0.9,
      dataQuality: 43,
      affiliateUrl: 'https://www.environmentalcareer.com',
    },
    {
      name: 'Monster',
      score: 35,
      grade: 'F',
      avgLifespan: 28,
      repostRate: 26,
      totalPostings: 4567,
      industry: 'General',
      topRole: 'Sales',
      trend: 'down',
      trendValue: -5.1,
      dataQuality: 38,
      affiliateUrl: 'https://www.monster.com/jobs',
    },
    {
      name: 'Mediabistro',
      score: 32,
      grade: 'F',
      avgLifespan: 24,
      repostRate: 20,
      totalPostings: 156,
      industry: 'Niche',
      topRole: 'Journalist',
      trend: 'down',
      trendValue: -2.3,
      dataQuality: 40,
      affiliateUrl: 'https://jobs.mediabistro.com',
    },
    {
      name: 'Reddit /r/sysadminjobs',
      score: 29,
      grade: 'F',
      avgLifespan: 25,
      repostRate: 28,
      totalPostings: 78,
      industry: 'Tech',
      topRole: 'System Admin',
      trend: 'down',
      trendValue: -1.5,
      dataQuality: 35,
      affiliateUrl: 'https://www.reddit.com/r/sysadminjobs',
    },
    {
      name: 'CraigsList',
      score: 28,
      grade: 'F',
      avgLifespan: 30,
      repostRate: 35,
      totalPostings: 5234,
      industry: 'General',
      topRole: 'General Labor',
      trend: 'down',
      trendValue: -6.8,
      dataQuality: 32,
      affiliateUrl: 'https://craigslist.org/search/jjj',
    },
    {
      name: 'Microsoft',
      score: 27,
      grade: 'F',
      avgLifespan: 35,
      repostRate: 22,
      totalPostings: 25000,
      industry: 'Tech',
      topRole: 'Software Engineer',
      trend: 'stable',
      trendValue: 0.2,
      dataQuality: 88,
      affiliateUrl: 'https://careers.microsoft.com',
    },
  ]

  const filtered = useMemo(() => {
    let result = boards.filter((b) => {
      const scoreMatch = b.score >= minScore
      const roleMatch = selectedRole === 'All Roles' || b.topRole === selectedRole
      const industryMatch = selectedIndustry === 'All Industries' || b.industry === selectedIndustry
      return scoreMatch && roleMatch && industryMatch
    })
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
  }, [sortBy, sortOrder, minScore, selectedRole, selectedIndustry])

  // Extract unique roles
  const uniqueRoles = useMemo(() => {
    const roles = boards.map((b) => b.topRole)
    return ['All Roles', ...Array.from(new Set(roles))].sort()
  }, [])

  // Extract unique industries
  const uniqueIndustries = useMemo(() => {
    const industries = boards.map((b) => b.industry)
    return ['All Industries', ...Array.from(new Set(industries))].sort()
  }, [])

  return (
    <DashboardLayout>
      <PageHeader title="Board Comparison" description="Compare efficiency scores across all job boards" />
      
      {/* Filters */}
      <Section title="Filters">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filter by Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:border-gray-600"
            >
              {uniqueIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Filter by Job Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white hover:border-gray-600"
            >
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Minimum Score</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-48"
            />
            <span className="ml-2 text-gray-300">{minScore}+</span>
          </div>
        </div>
      </Section>

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
                <th className="text-center py-3 px-4 text-gray-200">Action</th>
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
                  <td className="text-center py-4 px-4">
                    <a
                      href={b.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                    >
                      Visit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Recommended Tools">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-600 transition">
            <h3 className="text-lg font-semibold text-white mb-2">MyPerfectResume</h3>
            <p className="text-gray-400 text-sm mb-4">
              Build a professional resume with expert templates and AI-powered suggestions. Increase your chances of getting noticed by recruiters.
            </p>
            <a
              href="https://myperfectresume.com/c/20681"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </Section>
    </DashboardLayout>
  )
}
