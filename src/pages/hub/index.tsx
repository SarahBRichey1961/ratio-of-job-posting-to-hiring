import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { useRouter } from 'next/router'
import axios from 'axios'

interface HubProject {
  id: string
  title: string
  description: string
  difficulty_level: string
  category: string
  status: string
  creator: { username: string; avatar_url: string }
  created_at: string
}

interface HubDiscussion {
  id: string
  title: string
  type: string
  category: string
  status: string
  creator: { username: string; avatar_url: string }
  created_at: string
}

interface Opportunity {
  id: string
  title: string
  opportunity_type: string
  company_name: string
  created_at: string
}

const HubHome = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<HubProject[]>([])
  const [discussions, setDiscussions] = useState<HubDiscussion[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, discussionsRes, opportunitiesRes] = await Promise.all([
          axios.get('/api/hub/projects?limit=6'),
          axios.get('/api/hub/discussions?limit=6'),
          axios.get('/api/hub/opportunities?limit=6'),
        ])

        setProjects(projectsRes.data.data || [])
        setDiscussions(discussionsRes.data.data || [])
        setOpportunities(opportunitiesRes.data.data || [])
      } catch (error) {
        console.error('Error fetching hub data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Learning Hub - AI Community</title>
        <meta name="description" content="Learn AI, build solutions, connect with others" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Learning Hub</h1>
          <p className="text-lg text-gray-600">
            Join our community to learn AI, build solutions together, and find opportunities
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['overview', 'projects', 'discussions', 'opportunities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Hub</h2>
              <p className="text-gray-700 mb-6">
                This is a community space where you can:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">
                    <strong>Build AI Solutions:</strong> Collaborate on projects that solve real problems
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">
                    <strong>Learn Together:</strong> Share knowledge, ask questions, and grow your AI skills
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">
                    <strong>Find Opportunities:</strong> Discover jobs, freelance work, and mentorship
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700">
                    <strong>Build Your Portfolio:</strong> Showcase your work and get recognized
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start a Project</h3>
                <p className="text-gray-600 mb-4">
                  Lead a team to build an AI solution to a real problem
                </p>
                <Link href="/hub/projects/new">
                  <a className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Create Project
                  </a>
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Projects</h3>
                <p className="text-gray-600 mb-4">
                  Find a project to join and start contributing
                </p>
                <Link href="/hub/projects">
                  <a className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    View Projects
                  </a>
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ask Questions</h3>
                <p className="text-gray-600 mb-4">
                  Get help from the community on any topic
                </p>
                <Link href="/hub/discussions?type=question">
                  <a className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Ask Now
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
              <Link href="/hub/projects/new">
                <a className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                  New Project
                </a>
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No projects yet. Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Link key={project.id} href={`/hub/projects/${project.id}`}>
                    <a className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {project.difficulty_level}
                          </span>
                          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            {project.status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{project.creator.username}</span>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'discussions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Community Discussions</h2>
              <Link href="/hub/discussions/new">
                <a className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                  Start Discussion
                </a>
              </Link>
            </div>
            {discussions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No discussions yet. Start one!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <Link key={discussion.id} href={`/hub/discussions/${discussion.id}`}>
                    <a className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{discussion.title}</h3>
                        <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {discussion.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{discussion.creator.username}</span>
                        <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'opportunities' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Opportunities</h2>
              <Link href="/hub/opportunities/new">
                <a className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                  Post Opportunity
                </a>
              </Link>
            </div>
            {opportunities.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">
                  No opportunities available right now. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {opportunities.map((opp) => (
                  <Link key={opp.id} href={`/hub/opportunities/${opp.id}`}>
                    <a className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{opp.title}</h3>
                      <p className="text-gray-600 mb-4">{opp.company_name}</p>
                      <div className="flex justify-between items-center">
                        <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                          {opp.opportunity_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(opp.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default HubHome
