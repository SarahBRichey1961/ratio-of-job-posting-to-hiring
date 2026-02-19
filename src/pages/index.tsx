import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CategoryGroup } from '@/components/JobBoardsDisplay'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  description: string
}

interface HomeProps {
  jobBoardsByCategory: Record<string, JobBoard[]>
  totalBoards: number
}

const Home: NextPage<HomeProps> = ({ jobBoardsByCategory, totalBoards }) => {
  const router = useRouter()
  const categories = ['general', 'tech', 'remote', 'niche']

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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 text-lg">Job Boards Tracked</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{totalBoards}</p>
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
            {categories.map((category) => (
              jobBoardsByCategory[category] && jobBoardsByCategory[category].length > 0 && (
                <CategoryGroup
                  key={category}
                  categoryName={category}
                  boards={jobBoardsByCategory[category]}
                />
              )
            ))}
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
    const { data: boards, error } = await supabase
      .from('job_boards')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error

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
        totalBoards: 0,
      },
      revalidate: 60, // Retry after 60 seconds on error
    }
  }
}

export default Home
