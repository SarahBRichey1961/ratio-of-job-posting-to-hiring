import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { CategoryGroup } from '@/components/JobBoardsDisplay'
import { ScoreCard } from '@/components/ScoringDisplay'
import { EfficiencyScore } from '@/lib/scoringEngine'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  industry: string
  description: string
}

interface HomeProps {
  jobBoardsByCategory: Record<string, JobBoard[]>
  allBoards: JobBoard[]
  industries: string[]
  roles: string[]
  totalBoards: number
}

const Home: NextPage<HomeProps> = ({ jobBoardsByCategory, allBoards, industries, roles, totalBoards }) => {
  const router = useRouter()
  const categories = ['general', 'tech', 'remote', 'niche']
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // Filter state
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [filteredBoards, setFilteredBoards] = useState<JobBoard[]>(allBoards)
  const [scores, setScores] = useState<(EfficiencyScore & { rank?: number; grade?: string })[]>([])
  const [loadingScores, setLoadingScores] = useState(false)
  
  // Responsive sidebar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Apply filters
  useEffect(() => {
    let filtered = allBoards
    
    if (selectedIndustry) {
      filtered = filtered.filter(b => b.industry === selectedIndustry)
    }
    
    if (selectedRole) {
      filtered = filtered.filter(b => {
        // This will work better once roles are seeded in job_board_roles table
        return true
      })
    }
    
    setFilteredBoards(filtered)
    
    // Fetch scores for filtered boards
    const fetchScores = async () => {
      if (selectedIndustry && filtered.length > 0) {
        setLoadingScores(true)
        try {
          const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              boardIds: filtered.map(b => b.id),
              industry: selectedIndustry
            })
          })
          const data = await response.json()
          setScores(data.scores || [])
        } catch (error) {
          console.error('Failed to fetch scores:', error)
          setScores([])
        } finally {
          setLoadingScores(false)
        }
      } else {
        setScores([])
      }
    }
    
    fetchScores()
  }, [selectedIndustry, selectedRole, allBoards])

  return (
    <>
      <Head>
        <title>Job Posting to Hiring Ratio</title>
        <meta name="description" content="Analyze job board efficiency" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed md:relative md:flex z-40 flex-col h-screen ${
            sidebarOpen ? 'w-64' : 'w-0'
          } md:w-64 bg-white transition-all duration-300 overflow-y-auto border-r border-gray-200`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-2xl">📊</div>
                {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">Job Board Score</h1>}
              </div>
            </Link>
          </div>

          {/* Toggle Button */}
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2 flex-1">
            <Link href="/">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏠</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">Home</p>
                      <p className="text-xs opacity-75">Job board explorer</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/dashboard/comparison">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/dashboard/comparison'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚖️</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">Comparison</p>
                      <p className="text-xs opacity-75">Compare boards</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/dashboard/insights">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/dashboard/insights'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">💡</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">Insights</p>
                      <p className="text-xs opacity-75">Market trends</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/dashboard">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/dashboard'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📈</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">Dashboard</p>
                      <p className="text-xs opacity-75">Detailed metrics</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/dashboard/surveys">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/dashboard/surveys'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">Surveys</p>
                      <p className="text-xs opacity-75">Feedback forms</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <Link href="/dashboard/qa">
              <div className={`p-3 rounded-lg transition-colors cursor-pointer ${
                router.pathname === '/dashboard/qa'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  {sidebarOpen && (
                    <div>
                      <p className="font-medium">QA Tools</p>
                      <p className="text-xs opacity-75">Health check</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {sidebarOpen && (
              <div className="text-xs text-gray-500">
                <p className="font-semibold mb-1">Job Board Score</p>
                <p>MVP - {new Date().getFullYear()}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate flex-1">
              Job Board Explorer
            </h2>

            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto py-8 px-4">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Job Posting to Hiring Ratio
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Analyze job board efficiency and hiring trends across {totalBoards} major US job boards
                </p>
                
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Find Job Boards by Industry</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Industry <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedIndustry}
                        onChange={(e) => {
                          setSelectedIndustry(e.target.value)
                          setSelectedRole('')
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">-- All Industries ({industries.length}) --</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Choose an industry to see relevant job boards</p>
                    </div>
                    
                    {selectedIndustry && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filter by Role <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full px-4 py-2 border border-blue-300 bg-blue-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">-- All Roles in {selectedIndustry} --</option>
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Coming soon: Role-specific boards within this industry</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedIndustry && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        📊 {filteredBoards.length} {filteredBoards.length === 1 ? 'board' : 'boards'} in <strong>{selectedIndustry}</strong>
                        {selectedRole && ` with <strong>${selectedRole}</strong> roles`}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/dashboard">
                    <div className="bg-white border border-blue-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
                      <h3 className="font-semibold text-gray-900 text-lg">Job Boards Tracked</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{filteredBoards.length || totalBoards}</p>
                      <p className="text-xs text-gray-500 mt-2">View detailed board metrics →</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/comparison">
                    <div className="bg-white border border-green-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
                      <h3 className="font-semibold text-gray-900 text-lg">Efficiency Scores</h3>
                      <p className="text-gray-600 text-sm mt-2">Weighted algorithm (40% lifespan, 30% reposts, 20% employer, 10% candidate)</p>
                      <p className="text-xs text-gray-500 mt-2">Compare boards side-by-side →</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/insights">
                    <div className="bg-white border border-purple-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer">
                      <h3 className="font-semibold text-gray-900 text-lg">Analytics</h3>
                      <p className="text-gray-600 text-sm mt-2">Weekly insights and trend tracking</p>
                      <p className="text-xs text-gray-500 mt-2">Explore industry trends →</p>
                    </div>
                  </Link>
                </div>

                {/* Efficiency Scores Section */}
                {selectedIndustry && (
                  <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Efficiency Scores by Board</h2>
                    <p className="text-gray-600 mb-6">Ranking job boards in <strong>{selectedIndustry}</strong> by comprehensive efficiency metrics</p>
                    
                    {loadingScores ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Loading scores...</p>
                      </div>
                    ) : scores.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {scores.map((score) => (
                          <div key={score.boardId} className="transform hover:scale-105 transition">
                            <ScoreCard score={score} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
                        <p className="text-gray-500 mb-2">No scores available yet for {selectedIndustry}</p>
                        <p className="text-sm text-gray-400">Scores will be calculated once posting data is collected and analyzed</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Job Boards by Category */}
              <div className="space-y-8 pb-8">
                {categories.map((category) => {
                  const boardsInCategory = selectedIndustry
                    ? filteredBoards.filter(b => b.category === category)
                    : jobBoardsByCategory[category]
                  
                  return (
                    boardsInCategory && boardsInCategory.length > 0 && (
                      <CategoryGroup
                        key={category}
                        categoryName={category}
                        boards={boardsInCategory}
                      />
                    )
                  )
                })}
              </div>

              {/* Footer Info */}
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Day 1-2: Project setup and database schema</li>
                  <li>✓ Day 3: Seed job boards (44 boards loaded)</li>
                  <li>→ Day 4: Build scraper framework</li>
                  <li>→ Day 5: Normalize job titles</li>
                  <li>→ Day 6-7: Track posting lifespans & reposts</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const client = getSupabase()
    
    // If Supabase not initialized, return empty data
    if (!client) {
      console.error('Supabase client not initialized')
      return {
        props: {
          jobBoardsByCategory: {
            general: [],
            tech: [],
            remote: [],
            niche: [],
          },
          allBoards: [],
          industries: [],
          roles: [],
          totalBoards: 0,
        },
      }
    }

    // Fetch all job boards
    const { data: boards, error: boardsError } = await client
      .from('job_boards')
      .select('*')
      .order('industry')
      .order('name')

    if (boardsError) {
      console.error('Board fetch error:', boardsError)
      throw boardsError
    }

    console.log(`✅ Fetched ${(boards || []).length} boards`)

    // Fetch all roles
    const { data: rolesData, error: rolesError } = await client
      .from('job_roles')
      .select('name')
      .order('name')

    if (rolesError) {
      console.error('Roles fetch error:', rolesError)
      throw rolesError
    }

    // Fetch all industries
    const uniqueIndustries = Array.from(
      new Set((boards || []).map((b: JobBoard) => b.industry).filter(Boolean))
    ).sort() as string[]

    console.log(`✅ Found industries: ${uniqueIndustries.join(', ')}`)
    console.log(`✅ Found ${(rolesData || []).length} roles`)

    // Group by category
    const jobBoardsByCategory: Record<string, JobBoard[]> = {
      general: [],
      tech: [],
      remote: [],
      niche: [],
    }

    ;(boards || []).forEach((board: JobBoard) => {
      if (jobBoardsByCategory[board.category]) {
        jobBoardsByCategory[board.category].push(board)
      }
    })

    return {
      props: {
        jobBoardsByCategory,
        allBoards: boards || [],
        industries: uniqueIndustries,
        roles: (rolesData || []).map(r => r.name),
        totalBoards: (boards || []).length,
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      props: {
        jobBoardsByCategory: {
          general: [],
          tech: [],
          remote: [],
          niche: [],
        },
        allBoards: [],
        industries: [],
        roles: [],
        totalBoards: 0,
      },
    }
  }
}

export default Home
