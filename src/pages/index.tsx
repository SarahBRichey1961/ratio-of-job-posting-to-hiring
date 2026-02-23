import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { CategoryGroup } from '@/components/JobBoardsDisplay'

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
  
  // Apply filters
  useEffect(() => {
    let filtered = allBoards
    
    if (selectedIndustry) {
      filtered = filtered.filter(b => b.industry === selectedIndustry)
    }
    
    setFilteredBoards(filtered)
  }, [selectedIndustry, selectedRole, allBoards])

  // Bypass auth and go straight to dashboard
  useEffect(() => {
    router.push('/dashboard')
  }, [router])

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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Industry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Industries</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedIndustry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role (Coming Soon)
                    </label>
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    >
                      <option>Role filtering coming soon</option>
                    </select>
                  </div>
                )}
              </div>
              {selectedIndustry && (
                <div className="mt-4 text-sm text-gray-600">
                  Showing {filteredBoards.length} job boards in {selectedIndustry}
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
