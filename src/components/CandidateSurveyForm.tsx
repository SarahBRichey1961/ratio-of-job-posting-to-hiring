import React, { useState } from 'react';
import { uniqueId } from 'lodash';

interface CandidateSurveyFormProps {
  boardId?: string;
  boardName?: string;
  onSubmitSuccess?: () => void;
}

interface FormData {
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
  feedbackNotes: string;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

const CandidateSurveyForm: React.FC<CandidateSurveyFormProps> = ({
  boardId,
  boardName,
  onSubmitSuccess,
}) => {
  const emailLabelId = uniqueId('candidate-email-');
  const jobTitleLabelId = uniqueId('job-title-');
  const boardNameLabelId = uniqueId('board-name-');
  const statusLabelId = uniqueId('app-status-');
  const appExpLabelId = uniqueId('app-exp-');
  const clarityLabelId = uniqueId('clarity-');
  const interviewLabelId = uniqueId('interview-');
  const commLabelId = uniqueId('comm-');
  const fitLabelId = uniqueId('fit-');
  const salaryLabelId = uniqueId('salary-');
  const hireLabelId = uniqueId('hire-');
  const feedbackLabelId = uniqueId('feedback-');

  const [formData, setFormData] = useState<FormData>({
    candidateEmail: '',
    jobTitle: '',
    jobBoardName: boardName || '',
    applicationStatus: 'applied_only',
    applicationExperience: 'good',
    postingClarity: 'good',
    interviewQuality: 'n_a',
    communicationThroughout: 'n_a',
    roleFit: 'good',
    salaryTransparency: 'not_disclosed',
    hireBoardAgain: 'maybe',
    feedbackNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validation
    if (!formData.candidateEmail.trim()) {
      setMessage({ type: 'error', text: 'Email address is required.' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.jobTitle.trim()) {
      setMessage({ type: 'error', text: 'Job title is required.' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.jobBoardName.trim()) {
      setMessage({ type: 'error', text: 'Job board name is required.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        candidateEmail: formData.candidateEmail,
        jobTitle: formData.jobTitle,
        jobBoardName: formData.jobBoardName,
        applicationStatus: formData.applicationStatus,
        applicationExperience: formData.applicationExperience,
        postingClarity: formData.postingClarity,
        interviewQuality: formData.interviewQuality,
        communicationThroughout: formData.communicationThroughout,
        roleFit: formData.roleFit,
        salaryTransparency: formData.salaryTransparency,
        hireBoardAgain: formData.hireBoardAgain,
        feedbackNotes: formData.feedbackNotes,
        boardId: boardId || null,
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch('/api/surveys/candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Thank you! Your feedback has been recorded and will help improve job boards.',
        });
        // Reset form
        setFormData({
          candidateEmail: '',
          jobTitle: '',
          jobBoardName: boardName || '',
          applicationStatus: 'applied_only',
          applicationExperience: 'good',
          postingClarity: 'good',
          interviewQuality: 'n_a',
          communicationThroughout: 'n_a',
          roleFit: 'good',
          salaryTransparency: 'not_disclosed',
          hireBoardAgain: 'maybe',
          feedbackNotes: '',
        });
        // Trigger callback
        onSubmitSuccess?.();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to submit survey. Please try again.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please check your connection and try again.',
      });
      console.error('Survey submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-dismiss message after 5 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Message Display */}
      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <p
            className={
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Contact Information */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Contact Information
        </legend>

        <div>
          <label htmlFor={emailLabelId} className="block text-sm font-medium mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id={emailLabelId}
            type="email"
            name="candidateEmail"
            value={formData.candidateEmail}
            onChange={handleChange}
            required
            placeholder="your@email.com"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            We use this only to contact you about your feedback (optional follow-up).
          </p>
        </div>
      </fieldset>

      {/* Application Details */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Application Details
        </legend>

        <div>
          <label htmlFor={jobTitleLabelId} className="block text-sm font-medium mb-1">
            Job Title You Applied For <span className="text-red-500">*</span>
          </label>
          <input
            id={jobTitleLabelId}
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            required
            placeholder="e.g., Senior Software Engineer, Product Manager"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor={boardNameLabelId} className="block text-sm font-medium mb-1">
            Which Job Board Did You Use? <span className="text-red-500">*</span>
          </label>
          <input
            id={boardNameLabelId}
            type="text"
            name="jobBoardName"
            value={formData.jobBoardName}
            onChange={handleChange}
            required
            placeholder="e.g., LinkedIn, Indeed, Tech Jobs Daily"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor={statusLabelId} className="block text-sm font-medium mb-1">
            Application Outcome <span className="text-red-500">*</span>
          </label>
          <select
            id={statusLabelId}
            name="applicationStatus"
            value={formData.applicationStatus}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="applied_only">I applied but didn't hear back</option>
            <option value="rejected">I was rejected after applying</option>
            <option value="interviewed">I was interviewed</option>
            <option value="offered">I received an offer</option>
            <option value="hired">I was hired and started the job</option>
          </select>
        </div>
      </fieldset>

      {/* Application Experience */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Application Experience
        </legend>

        <div>
          <label htmlFor={appExpLabelId} className="block text-sm font-medium mb-1">
            How easy was the application process? <span className="text-red-500">*</span>
          </label>
          <select
            id={appExpLabelId}
            name="applicationExperience"
            value={formData.applicationExperience}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="poor">Poor - Very complicated or confusing</option>
            <option value="fair">Fair - Somewhat difficult</option>
            <option value="good">Good - Straightforward</option>
            <option value="excellent">Excellent - Very easy</option>
            <option value="exceptional">Exceptional - Best I've experienced</option>
          </select>
        </div>

        <div>
          <label htmlFor={clarityLabelId} className="block text-sm font-medium mb-1">
            How clear was the job posting? <span className="text-red-500">*</span>
          </label>
          <select
            id={clarityLabelId}
            name="postingClarity"
            value={formData.postingClarity}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="poor">Poor - Very unclear or missing info</option>
            <option value="fair">Fair - Some important details missing</option>
            <option value="good">Good - Clear requirements and expectations</option>
            <option value="excellent">Excellent - Very detailed and clear</option>
            <option value="exceptional">Exceptional - Exceptionally well-written</option>
          </select>
        </div>
      </fieldset>

      {/* Interview & Communication (Conditional) */}
      {(formData.applicationStatus === 'interviewed' ||
        formData.applicationStatus === 'offered' ||
        formData.applicationStatus === 'hired') && (
        <fieldset className="border rounded-lg p-6 space-y-4">
          <legend className="text-lg font-semibold px-2">
            Interview & Communication
          </legend>

          <div>
            <label htmlFor={interviewLabelId} className="block text-sm font-medium mb-1">
              How would you rate the interview process? <span className="text-red-500">*</span>
            </label>
            <select
              id={interviewLabelId}
              name="interviewQuality"
              value={formData.interviewQuality}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="poor">Poor - Disorganized or unprofessional</option>
              <option value="fair">Fair - Some issues with preparation</option>
              <option value="good">Good - Well-organized interview</option>
              <option value="excellent">Excellent - Professional and thorough</option>
              <option value="exceptional">Exceptional - Outstanding process</option>
            </select>
          </div>

          <div>
            <label htmlFor={commLabelId} className="block text-sm font-medium mb-1">
              How was the communication throughout the process?{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              id={commLabelId}
              name="communicationThroughout"
              value={formData.communicationThroughout}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="poor">
                Poor - Long delays or no updates
              </option>
              <option value="fair">Fair - Some delays in communication</option>
              <option value="good">Good - Regular updates</option>
              <option value="excellent">Excellent - Clear and timely updates</option>
              <option value="exceptional">Exceptional - Proactive communication</option>
            </select>
          </div>
        </fieldset>
      )}

      {/* Role Fit & Salary */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Role Fit & Compensation
        </legend>

        <div>
          <label htmlFor={fitLabelId} className="block text-sm font-medium mb-1">
            Was the role a good fit for your skills? <span className="text-red-500">*</span>
          </label>
          <select
            id={fitLabelId}
            name="roleFit"
            value={formData.roleFit}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="poor">Poor - Not aligned with my experience</option>
            <option value="fair">Fair - Some misalignment</option>
            <option value="good">Good - Decent fit</option>
            <option value="excellent">Excellent - Great fit</option>
            <option value="exceptional">Exceptional - Perfect match</option>
          </select>
        </div>

        <div>
          <label htmlFor={salaryLabelId} className="block text-sm font-medium mb-1">
            Salary & Benefits Transparency <span className="text-red-500">*</span>
          </label>
          <select
            id={salaryLabelId}
            name="salaryTransparency"
            value={formData.salaryTransparency}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="not_disclosed">
              Not disclosed - No salary range in posting
            </option>
            <option value="insufficient">
              Insufficient - Very vague range
            </option>
            <option value="adequate">Adequate - Reasonable range provided</option>
            <option value="competitive">Competitive - Clear and fair range</option>
            <option value="excellent">
              Excellent - Full transparency on package
            </option>
          </select>
        </div>
      </fieldset>

      {/* Recommendation */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Recommendation
        </legend>

        <div>
          <label htmlFor={hireLabelId} className="block text-sm font-medium mb-1">
            Would you recommend this job board to other job seekers?{' '}
            <span className="text-red-500">*</span>
          </label>
          <select
            id={hireLabelId}
            name="hireBoardAgain"
            value={formData.hireBoardAgain}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="definitely_not">Definitely not - Poor experience</option>
            <option value="probably_not">Probably not - More bad than good</option>
            <option value="maybe">Maybe - Mixed experience</option>
            <option value="probably">Probably - Mostly positive</option>
            <option value="definitely">
              Definitely - Excellent job board
            </option>
          </select>
        </div>
      </fieldset>

      {/* Additional Feedback */}
      <fieldset className="border rounded-lg p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">
          Additional Feedback
        </legend>

        <div>
          <label htmlFor={feedbackLabelId} className="block text-sm font-medium mb-1">
            Any additional comments or suggestions?
          </label>
          <textarea
            id={feedbackLabelId}
            name="feedbackNotes"
            value={formData.feedbackNotes}
            onChange={handleChange}
            placeholder="Share your thoughts to help us improve job board recommendations..."
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your feedback is valuable and helps candidates and employers find the best job boards.
          </p>
        </div>
      </fieldset>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
};

export default CandidateSurveyForm;
