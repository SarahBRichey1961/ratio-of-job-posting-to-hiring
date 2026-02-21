import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CandidateSurveyPayload {
  candidateEmail: string;
  jobTitle: string;
  jobBoardName: string;
  applicationStatus: 'applied_only' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  applicationExperience: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional';
  postingClarity: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional';
  interviewQuality: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional' | 'n_a';
  communicationThroughout: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional' | 'n_a';
  roleFit: 'poor' | 'fair' | 'good' | 'excellent' | 'exceptional';
  salaryTransparency: 'not_disclosed' | 'insufficient' | 'adequate' | 'competitive' | 'excellent';
  hireBoardAgain: 'definitely_not' | 'probably_not' | 'maybe' | 'probably' | 'definitely';
  feedbackNotes?: string;
  boardId?: string;
  submittedAt: string;
}

const VALID_APP_STATUS = ['applied_only', 'interviewed', 'offered', 'hired', 'rejected'];
const VALID_QUALITY_RATINGS = ['poor', 'fair', 'good', 'excellent', 'exceptional'];
const VALID_SALARY_TRANSPARENCY = [
  'not_disclosed',
  'insufficient',
  'adequate',
  'competitive',
  'excellent',
];
const VALID_RECOMMENDATION = ['definitely_not', 'probably_not', 'maybe', 'probably', 'definitely'];

interface ErrorResponse {
  error: string;
}

interface SuccessResponse {
  success: boolean;
  data: {
    id: string;
    candidate_email: string;
    job_title: string;
    created_at: string;
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'This endpoint only accepts POST requests' });
  }

  const {
    candidateEmail,
    jobTitle,
    jobBoardName,
    applicationStatus,
    applicationExperience,
    postingClarity,
    interviewQuality,
    communicationThroughout,
    roleFit,
    salaryTransparency,
    hireBoardAgain,
    feedbackNotes,
    boardId,
    submittedAt,
  } = req.body as CandidateSurveyPayload;

  // Validate required fields
  const requiredFields = [
    'candidateEmail',
    'jobTitle',
    'jobBoardName',
    'applicationStatus',
    'applicationExperience',
    'postingClarity',
    'roleFit',
    'salaryTransparency',
    'hireBoardAgain',
    'submittedAt',
  ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(candidateEmail)) {
    return res
      .status(400)
      .json({ error: 'Invalid email format. Please provide a valid email address.' });
  }

  // Validate enums
  if (!VALID_APP_STATUS.includes(applicationStatus)) {
    return res.status(400).json({
      error: `Invalid applicationStatus. Must be one of: ${VALID_APP_STATUS.join(', ')}`,
    });
  }

  if (!VALID_QUALITY_RATINGS.includes(applicationExperience)) {
    return res.status(400).json({
      error: `Invalid applicationExperience. Must be one of: ${VALID_QUALITY_RATINGS.join(', ')}`,
    });
  }

  if (!VALID_QUALITY_RATINGS.includes(postingClarity)) {
    return res.status(400).json({
      error: `Invalid postingClarity. Must be one of: ${VALID_QUALITY_RATINGS.join(', ')}`,
    });
  }

  if (!['n_a', ...VALID_QUALITY_RATINGS].includes(interviewQuality)) {
    return res.status(400).json({
      error: `Invalid interviewQuality. Must be one of: n_a, ${VALID_QUALITY_RATINGS.join(', ')}`,
    });
  }

  if (!['n_a', ...VALID_QUALITY_RATINGS].includes(communicationThroughout)) {
    return res.status(400).json({
      error: `Invalid communicationThroughout. Must be one of: n_a, ${VALID_QUALITY_RATINGS.join(
        ', '
      )}`,
    });
  }

  if (!VALID_QUALITY_RATINGS.includes(roleFit)) {
    return res.status(400).json({
      error: `Invalid roleFit. Must be one of: ${VALID_QUALITY_RATINGS.join(', ')}`,
    });
  }

  if (!VALID_SALARY_TRANSPARENCY.includes(salaryTransparency)) {
    return res.status(400).json({
      error: `Invalid salaryTransparency. Must be one of: ${VALID_SALARY_TRANSPARENCY.join(', ')}`,
    });
  }

  if (!VALID_RECOMMENDATION.includes(hireBoardAgain)) {
    return res.status(400).json({
      error: `Invalid hireBoardAgain. Must be one of: ${VALID_RECOMMENDATION.join(', ')}`,
    });
  }

  // Validate date
  try {
    new Date(submittedAt);
  } catch {
    return res.status(400).json({
      error: 'Invalid submittedAt timestamp. Must be a valid ISO 8601 string.',
    });
  }

  // Insert into database
  try {
    const { data, error } = await supabase.from('candidate_surveys').insert([
      {
        candidate_email: candidateEmail,
        job_title: jobTitle,
        job_board_name: jobBoardName,
        application_status: applicationStatus,
        application_experience: applicationExperience,
        posting_clarity: postingClarity,
        interview_quality: interviewQuality,
        communication_throughout: communicationThroughout,
        role_fit: roleFit,
        salary_transparency: salaryTransparency,
        hire_board_again: hireBoardAgain,
        feedback_notes: feedbackNotes || null,
        job_board_id: boardId || null,
        submitted_at: new Date(submittedAt).toISOString(),
        // created_at is set by database DEFAULT NOW()
      },
    ]).select();

    if (error) {
      console.error('Survey insertion error:', error);
      return res.status(500).json({
        error: 'Failed to store survey response',
      });
    }

    if (!data || data.length === 0) {
      return res.status(500).json({
        error: 'Failed to store survey response - no data returned',
      });
    }

    const surveyData = data as Array<{ id: string; candidate_email: string; job_title: string; created_at: string }>
    return res.status(200).json({
      success: true,
      data: {
        id: surveyData[0].id,
        candidate_email: surveyData[0].candidate_email,
        job_title: surveyData[0].job_title,
        created_at: surveyData[0].created_at,
      },
    });
  } catch (err) {
    console.error('Server error during survey submission:', err);
    return res.status(500).json({
      error: 'Internal server error occurred',
    });
  }
}
