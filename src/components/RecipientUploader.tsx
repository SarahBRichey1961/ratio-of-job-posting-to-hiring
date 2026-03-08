import React, { useState, useRef } from 'react'
import axios from 'axios'

interface RecipientUploaderProps {
  campaignId: string
  accessToken: string
  onSuccess: () => void | Promise<void>
}

export default function RecipientUploader({ campaignId, accessToken, onSuccess }: RecipientUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout>()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // Parse CSV - expects: email,name OR just email
      const recipients = lines
        .slice(1) // Skip header
        .map(line => {
          const [email, ...nameParts] = line.split(',').map(s => s.trim())
          return {
            email: email?.toLowerCase(),
            name: nameParts.join(' ') || email?.split('@')[0] || ''
          }
        })
        .filter(r => r.email && r.email.includes('@'))

      if (recipients.length === 0) {
        setError('No valid email addresses found in CSV')
        setLoading(false)
        return
      }

      const response = await axios.post(
        `/api/marketing/campaigns/${campaignId}/recipients`,
        { recipients },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      setSuccess(`✓ Added ${recipients.length} recipients to campaign`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Wait a moment for database to update, then call onSuccess
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(async () => {
        await onSuccess()
      }, 1000)
    } catch (err) {
      console.error('Error uploading recipients:', err)
      setError((err as any).response?.data?.error || 'Failed to add recipients')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">📧 Add Recipients</h3>
      
      <div className="space-y-4">
        {/* CSV Template */}
        <div className="bg-white p-4 rounded border border-blue-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">CSV Format (Required):</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`email,name
john@example.com,John Doe
jane@example.com,Jane Smith
bob@example.com,Bob Jones`}
          </pre>
          <p className="text-xs text-gray-600 mt-2">
            ℹ️ Header row required. Name column is optional.
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block">
            <span className="sr-only">Choose CSV file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
          </label>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {loading && (
          <div className="text-blue-600 flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}
