import React, { useState } from 'react';
import Head from 'next/head';
import CandidateSurveyForm from '../components/CandidateSurveyForm';

const CandidateFeedbackPage: React.FC = () => {
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  return (
    <>
      <Head>
        <title>Share Your Job Search Experience — Job Board Scorer</title>
        <meta
          name="description"
          content="Help us understand your job search experience and improve job board recommendations."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Share Your Job Search Experience
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your feedback helps us understand which job boards work best for job seekers.
              This information will improve recommendations for future candidates.
            </p>
          </div>

          {/* Success Message */}
          {surveySubmitted && (
            <div className="mb-12 rounded-lg bg-green-50 border border-green-200 p-8 text-center">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Thank You!
              </h2>
              <p className="text-green-800 mb-4">
                Your feedback has been recorded successfully. We really appreciate you taking the time
                to share your experience.
              </p>
              <p className="text-sm text-green-700">
                Your insights will help job seekers find the best platforms for their careers.
              </p>
            </div>
          )}

          {/* Survey Form */}
          {!surveySubmitted && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Feedback
              </h2>
              <CandidateSurveyForm
                onSubmitSuccess={() => setSurveySubmitted(true)}
              />
            </div>
          )}

          {/* About This Survey Section */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                What We Ask
              </h3>
              <p className="text-gray-600">
                We ask about your application experience, job posting clarity, interview
                process, role fit, salary transparency, and whether you'd recommend
                the job board to others.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Your Privacy
              </h3>
              <p className="text-gray-600">
                Your email is used only for optional follow-up. All other data is
                anonymized and aggregated. We never sell your information to third parties.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                How It Helps
              </h3>
              <p className="text-gray-600">
                Your feedback directly improves our job board recommendations. We share
                insights with job seekers to help them choose the best platforms for
                their careers.
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Why are you collecting this feedback?
                </h3>
                <p className="text-gray-600">
                  We're building a system to help job seekers find the best job boards
                  based on real candidate experiences. Your feedback is crucial for understanding
                  which platforms work best for different types of candidates and roles.
                </p>
              </div>

              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How do you protect my privacy?
                </h3>
                <p className="text-gray-600">
                  Your data is stored securely in an encrypted database and is only used
                  in aggregate form for analysis. We never share individual survey responses
                  with job boards or other third parties. Your email is optional and used
                  only for feedback follow-up if you choose to provide it.
                </p>
              </div>

              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long does this take?
                </h3>
                <p className="text-gray-600">
                  Most candidates complete the survey in 3–5 minutes. The form adapts based
                  on your answers (for example, interview questions only appear if you were
                  interviewed).
                </p>
              </div>

              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Will my employer see my feedback?
                </h3>
                <p className="text-gray-600">
                  No. Your feedback is completely anonymous to employers. We only aggregate
                  data at the job board level, never linking feedback to your name or company.
                  Employers have no access to survey responses.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How is this information used?
                </h3>
                <p className="text-gray-600">
                  Your feedback is aggregated with other responses to create job board
                  efficiency scores. These scores help other candidates make informed decisions
                  about which platforms to use. We also produce industry reports and trends
                  based on anonymized aggregated data.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action Footer */}
          <div className="bg-indigo-600 rounded-lg shadow-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              Help Us Improve Job Board Recommendations
            </h2>
            <p className="text-lg mb-4">
              Your experience matters. A few minutes of your time can help thousands of job seekers
              find better platforms.
            </p>
            {surveySubmitted && (
              <button
                onClick={() => setSurveySubmitted(false)}
                className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Submit Another Response
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CandidateFeedbackPage;
