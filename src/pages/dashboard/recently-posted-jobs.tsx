import React, { useState } from 'react'
import type { GetServerSideProps } from 'next'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Button, Section } from '@/components/DashboardUI'

interface JobListing {
  id: string
  title: string
  company?: string
  location?: string
  url?: string
  salary?: string
  postedDate: string
  description?: string
  jobType?: 'remote' | 'hybrid' | 'onsite'
  source: string
}

interface RecentlyPostedJobsProps {}

const RecentlyPostedJobsPage: React.FC<RecentlyPostedJobsProps> = () => {
  const [mounted, setMounted] = useState(false)
  const [jobTitle, setJobTitle] = useState<string>('')
  const [jobType, setJobType] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [searchResults, setSearchResults] = useState<JobListing[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string>('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Only render relative time after hydration to avoid server/client mismatch
  // Also clear any persisted form state
  React.useEffect(() => {
    setMounted(true)
    // Reset form to clean state - search nationwide by default
    setJobTitle('')
    setJobType('')
    setLocation('')
    setShowSearchResults(false)
  }, [])

  // Validate the search form
  const validateSearch = (): string | null => {
    if (!jobTitle.trim()) {
      return 'Please enter a job title'
    }

    if (jobType === 'onsite' && !location.trim()) {
      return 'Please enter a location for on-site jobs'
    }

    return null
  }

  // Search for recently posted jobs
  const handleSearchJobs = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const validationError = validateSearch()
    if (validationError) {
      setSearchError(validationError)
      return
    }

    setSearchLoading(true)
    setSearchError('')

    try {
      let url = `/api/jobs/search-multi?query=${encodeURIComponent(jobTitle)}`

      // Add job type filter (but NOT for "All Types" which is empty string)
      if (jobType) {
        url += `&jobType=${encodeURIComponent(jobType)}`
      }
      
      // Add location ONLY if on-site selected AND location is provided
      if (jobType === 'onsite' && location && location.trim()) {
        url += `&location=${encodeURIComponent(location.trim())}`
      }

      // Add time range: last 3 days (72 hours)
      url += '&hoursBack=72'

      console.log('🔍 Searching recently posted jobs:', {
        title: jobTitle,
        jobType: jobType || 'all types',
        location: jobType === 'onsite' && location && location.trim() ? location.trim() : '(nationwide)',
      })

      const response = await fetch(url)
      console.log('📡 API Response status:', response.status)

      const data = await response.json()
      console.log('✅ API Response:', data)

      if (data.success && data.jobs && data.jobs.length > 0) {
        // Filter by posted date (last 3 days / 72 hours)
        const now = new Date()
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

        const recentJobs = (data.jobs || []).filter((job: JobListing) => {
          const postedTime = new Date(job.postedDate)
          return postedTime >= threeDaysAgo
        })

        console.log(
          `🎉 Found ${recentJobs.length} jobs posted in last 3 days (from ${data.jobs?.length || 0} total)`
        )

        setSearchResults(recentJobs)
        setShowSearchResults(true)

        if (recentJobs.length === 0) {
          setSearchError(
            'No jobs found matching your criteria in the last 3 days. Try adjusting your filters.'
          )
        }
      } else {
        let errorMsg = data.error || 'No jobs found'
        if (!data.success) {
          errorMsg = 'No jobs found matching your search criteria. Try different search terms.'
        }
        console.error('❌ API returned error:', errorMsg)
        setSearchError(errorMsg)
        setSearchResults([])
      }
    } catch (error) {
      console.error('💥 Search error:', error)
      setSearchError('Failed to search jobs. Please try again.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffMs = now.getTime() - posted.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Recently Posted Jobs"
        description="Find jobs posted in the last 3 days with advanced filtering"
      />

      <Section title="Job Search Filters">
        <form onSubmit={handleSearchJobs} className="space-y-6">
          {/* Search Title */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Engineer, Product Manager, Data Scientist..."
              className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Two-column filter layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Filter by Job Type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Job Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="jobType"
                    value=""
                    checked={jobType === ''}
                    onChange={(e) => {
                      setJobType(e.target.value)
                      setLocation('')
                    }}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-2 text-white font-medium">All Types</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="jobType"
                    value="remote"
                    checked={jobType === 'remote'}
                    onChange={(e) => {
                      setJobType(e.target.value)
                      setLocation('')
                    }}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-2 text-white font-medium">Remote</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="jobType"
                    value="hybrid"
                    checked={jobType === 'hybrid'}
                    onChange={(e) => {
                      setJobType(e.target.value)
                      setLocation('')
                    }}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-2 text-white font-medium">Hybrid</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="jobType"
                    value="onsite"
                    checked={jobType === 'onsite'}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <span className="ml-2 text-white font-medium">On-Site *</span>
                </label>
              </div>
            </div>

            {/* Location (only for on-site) */}
            {jobType === 'onsite' && (
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Location (Required) *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-4 py-2 rounded-lg border bg-gray-700 text-white placeholder-gray-400 border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-100">
              {searchError}
            </div>
          )}

          {/* Search Button */}
          <div>
            <button
              type="submit"
              disabled={searchLoading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
            >
              {searchLoading ? '⏳ Searching...' : '🔍 Search Jobs (Last 3 Days)'}
            </button>
          </div>
        </form>
      </Section>

      {/* Search Results - only render after hydration */}
      {mounted && showSearchResults && (
        <Section title={`Found ${searchResults.length} Jobs`}>
          {searchResults.length === 0 ? (
            <div className="p-6 bg-gray-700 rounded-lg text-center">
              <p className="text-white text-lg mb-2">No jobs found</p>
              <p className="text-gray-300">
                Try adjusting your search criteria or check back later
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {searchResults.map((job, index) => (
                <div
                  key={job.id || index}
                  className="p-4 bg-gray-700 border border-gray-600 rounded-lg hover:border-blue-500 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{job.title}</h3>
                      <p className="text-blue-300 font-semibold">{job.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        {job.source}
                      </span>
                      <span className="text-xs text-gray-300">⏱️ {mounted ? formatTimeAgo(job.postedDate) : ''}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {job.location && (
                      <p className="text-white">
                        📍 <span className="text-gray-200">{job.location}</span>
                      </p>
                    )}
                    {job.jobType && (
                      <p className="text-white">
                        💼{' '}
                        <span className="text-gray-200 capitalize">
                          {job.jobType === 'onsite' ? 'On-Site' : job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                        </span>
                      </p>
                    )}
                    {job.salary && (
                      <p className="text-green-300 font-semibold">
                        💰 {job.salary}
                      </p>
                    )}
                  </div>

                  {job.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Job →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Help Text */}
      <Section title="About This Page">
        <div className="p-4 bg-gray-700 rounded-lg text-gray-100 space-y-2">
          <p>
            ✅ <strong>Real-time Jobs:</strong> Shows only jobs posted in the last 72 hours
          </p>
          <p>
            ✅ <strong>Multi-Source:</strong> Searches across Adzuna, StackOverflow, JSearch, and more
          </p>
          <p>
            ✅ <strong>Smart Filtering:</strong> Combine title, industry, and job type for best results
          </p>
          <p className="text-xs text-gray-400 mt-4">
            * = Required fields
          </p>
        </div>
      </Section>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  }
}

export default RecentlyPostedJobsPage
