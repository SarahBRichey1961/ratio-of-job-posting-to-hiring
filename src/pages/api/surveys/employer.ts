import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

interface EmployerSurveyData {
  companyName: string
  industry: string
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  hireCount: number
  timeToHire: number
  postingQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional'
  responseQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional'
  hireCost: number
  generalNotes: string
  boardId?: string
  boardName?: string
  submittedAt: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const surveyData: EmployerSurveyData = req.body

    // Validate required fields
    const requiredFields = [
      'companyName',
      'industry',
      'companySize',
      'hireCount',
      'timeToHire',
      'postingQuality',
      'responseQuality',
      'hireCost',
      'submittedAt',
    ]

    for (const field of requiredFields) {
      if (!(field in surveyData)) {
        return res.status(400).json({ error: `Missing required field: ${field}` })
      }
    }

    // Validate numeric fields
    if (isNaN(surveyData.hireCount) || surveyData.hireCount < 0) {
      return res.status(400).json({ error: 'hireCount must be a positive number' })
    }

    if (isNaN(surveyData.timeToHire) || surveyData.timeToHire < 0) {
      return res.status(400).json({ error: 'timeToHire must be a positive number' })
    }

    if (isNaN(surveyData.hireCost) || surveyData.hireCost < 0) {
      return res.status(400).json({ error: 'hireCost must be a positive number' })
    }

    // Insert survey into database
    const { data, error } = await supabase
      .from('employer_surveys')
      .insert([
        {
          company_name: surveyData.companyName,
          industry: surveyData.industry,
          company_size: surveyData.companySize,
          successful_hires: surveyData.hireCount,
          average_time_to_hire: surveyData.timeToHire,
          candidate_quality: surveyData.postingQuality,
          posting_experience: surveyData.responseQuality,
          average_cost_per_hire: surveyData.hireCost,
          general_notes: surveyData.generalNotes || null,
          job_board_id: surveyData.boardId || null,
          job_board_name: surveyData.boardName || null,
          submitted_at: surveyData.submittedAt,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ 
        error: 'Failed to store survey',
        details: error.message 
      })
    }

    res.status(200).json({
      success: true,
      message: 'Survey submitted successfully',
      data: data,
    })
  } catch (error) {
    console.error('Server error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
