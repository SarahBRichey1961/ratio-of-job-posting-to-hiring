import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
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
  
  // Filter state
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [filteredBoards, setFilteredBoards] = useState<JobBoard[]>(allBoards)
  const [scores, setScores] = useState<(EfficiencyScore & { rank?: number; grade?: string })[]>([])
  const [loadingScores, setLoadingScores] = useState(false)
  
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

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
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
              <div className="bg-white border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 text-lg">Job Boards Tracked</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{filteredBoards.length || totalBoards}</p>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 text-lg">Efficiency Scores</h3>
                <p className="text-gray-600 text-sm mt-2">Weighted algorithm (40% lifespan, 30% reposts, 20% employer, 10% candidate)</p>
              </div>
              <div className="bg-white border border-purple-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 text-lg">Analytics</h3>
                <p className="text-gray-600 text-sm mt-2">Weekly insights and trend tracking</p>
              </div>
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
          <div className="space-y-8">
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
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Day 1-2: Project setup and database schema</li>
              <li>✓ Day 3: Seed job boards (30+ boards loaded)</li>
              <li>→ Day 4: Build scraper framework</li>
              <li>→ Day 5: Normalize job titles</li>
              <li>→ Day 6-7: Track posting lifespans & reposts</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const client = getSupabase()
    
    // If Supabase not initialized (missing env vars during build), return empty data
    if (!client) {
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
        revalidate: 60,
      }
    }

    // Fetch all job boards
    const { data: boards, error: boardsError } = await client
      .from('job_boards')
      .select('*')
      .order('industry')
      .order('name')

    if (boardsError) throw boardsError

    // Fetch all industries
    const uniqueIndustries = Array.from(
      new Set((boards || []).map((b: JobBoard) => b.industry).filter(Boolean))
    ).sort() as string[]

    // Fetch roles
    const { data: roleData, error: rolesError } = await client
      .from('job_roles')
      .select('name')
      .order('name')

    if (rolesError) {
      console.warn('Could not fetch job roles:', rolesError)
    }

    const roles = (roleData || []).map((r: any) => r.name)

    // Group by category
    const grouped: Record<string, JobBoard[]> = {
      general: [],
      tech: [],
      remote: [],
      niche: [],
    }

    boards?.forEach((board: JobBoard) => {
      if (grouped[board.category]) {
        grouped[board.category].push(board)
      }
    })

    return {
      props: {
        jobBoardsByCategory: grouped,
        allBoards: boards || [],
        industries: uniqueIndustries,
        roles: roles,
        totalBoards: boards?.length || 0,
      },
      revalidate: 3600, // ISR: revalidate every hour
    }
  } catch (error) {
    console.error('Error fetching job boards:', error)
    
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
      revalidate: 60,
    }
  }
}

export default Home
