'use client'

import React, { useState } from 'react'
import { Button } from '@/components/DashboardUI'

interface EmployerSurveyFormProps {
  boardId?: string
  boardName?: string
  onSubmitSuccess?: () => void
}

export function EmployerSurveyForm({
  boardId,
  boardName,
  onSubmitSuccess,
}: EmployerSurveyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: 'medium',
    hireCount: '',
    timeToHire: '',
    postingQuality: 'good',
    responseQuality: 'good',
    hireCost: '',
    generalNotes: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/surveys/employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          boardId: boardId || null,
          boardName: boardName || null,
          submittedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      setSubmitStatus('success')
      setFormData({
        companyName: '',
        industry: '',
        companySize: 'medium',
        hireCount: '',
        timeToHire: '',
        postingQuality: 'good',
        responseQuality: 'good',
        hireCost: '',
        generalNotes: '',
      })

      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 1500)
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {submitStatus === 'success' && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-400 font-semibold">✓ Survey submitted successfully!</p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 font-semibold">✗ {errorMessage}</p>
        </div>
      )}

      {/* Company Info Section */}
      <fieldset className="space-y-4 p-4 sm:p-6 border border-gray-700 rounded-lg bg-gray-800/50">
        <legend className="text-lg font-semibold text-white mb-4">Company Information</legend>

        <div>
          <label htmlFor="companyName" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Acme Corp"
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Industry *
          </label>
          <input
            id="industry"
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            placeholder="e.g., Technology, Finance, Healthcare"
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="companySize" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Company Size *
          </label>
          <select
            id="companySize"
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="startup">Startup (1-50)</option>
            <option value="small">Small (51-200)</option>
            <option value="medium">Medium (201-1000)</option>
            <option value="large">Large (1001-5000)</option>
            <option value="enterprise">Enterprise (5000+)</option>
          </select>
        </div>
      </fieldset>

      {/* Hiring Metrics Section */}
      <fieldset className="space-y-4 p-4 sm:p-6 border border-gray-700 rounded-lg bg-gray-800/50">
        <legend className="text-lg font-semibold text-white mb-4">Hiring Metrics</legend>

        <div>
          <label htmlFor="hireCount" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Successful Hires from Board (Last 30 Days) *
          </label>
          <input
            id="hireCount"
            type="number"
            name="hireCount"
            value={formData.hireCount}
            onChange={handleInputChange}
            placeholder="e.g., 5"
            min="0"
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1.5">Number of candidates successfully hired</p>
        </div>

        <div>
          <label htmlFor="timeToHire" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Average Time to Hire (Days) *
          </label>
          <input
            id="timeToHire"
            type="number"
            name="timeToHire"
            value={formData.timeToHire}
            onChange={handleInputChange}
            placeholder="e.g., 14"
            min="0"
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1.5">From job posting to successful hire</p>
        </div>

        <div>
          <label htmlFor="hireCost" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Average Cost per Hire ($) *
          </label>
          <input
            id="hireCost"
            type="number"
            name="hireCost"
            value={formData.hireCost}
            onChange={handleInputChange}
            placeholder="e.g., 2500"
            min="0"
            step="0.01"
            required
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-500 mt-1.5">Total cost including recruitment fees and time</p>
        </div>
      </fieldset>

      {/* Quality Assessment Section */}
      <fieldset className="space-y-4 p-4 sm:p-6 border border-gray-700 rounded-lg bg-gray-800/50">
        <legend className="text-lg font-semibold text-white mb-4">Quality Assessment</legend>

        <div>
          <label htmlFor="postingQuality" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Quality of Candidate Responses *
          </label>
          <select
            id="postingQuality"
            name="postingQuality"
            value={formData.postingQuality}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="poor">Poor - Few qualified candidates</option>
            <option value="fair">Fair - Some qualified candidates</option>
            <option value="good">Good - Most candidates qualified</option>
            <option value="excellent">Excellent - High-quality candidates</option>
            <option value="exceptional">Exceptional - Exceptional quality</option>
          </select>
          <p className="text-xs text-gray-500 mt-1.5">Rating of applicant quality from this board</p>
        </div>

        <div>
          <label htmlFor="responseQuality" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            Board Posting Experience *
          </label>
          <select
            id="responseQuality"
            name="responseQuality"
            value={formData.responseQuality}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="poor">Poor - Difficult to use</option>
            <option value="fair">Fair - Some issues</option>
            <option value="good">Good - Overall satisfactory</option>
            <option value="excellent">Excellent - Easy to use</option>
            <option value="exceptional">Exceptional - Best experience</option>
          </select>
          <p className="text-xs text-gray-500 mt-1.5">Your experience posting and managing listings</p>
        </div>
      </fieldset>

      {/* Comments Section */}
      <fieldset className="space-y-4 p-4 sm:p-6 border border-gray-700 rounded-lg bg-gray-800/50">
        <legend className="text-lg font-semibold text-white mb-4">Additional Feedback</legend>

        <div>
          <label htmlFor="generalNotes" className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            General Notes
          </label>
          <textarea
            id="generalNotes"
            name="generalNotes"
            value={formData.generalNotes}
            onChange={handleInputChange}
            placeholder="Any additional comments about your experience with this job board..."
            rows={4}
            className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">Optional: Share any additional insights</p>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : '✓ Submit Survey'}
        </Button>
        <p className="text-xs text-gray-500 self-center">
          * Required fields
        </p>
      </div>
    </form>
  )
}
