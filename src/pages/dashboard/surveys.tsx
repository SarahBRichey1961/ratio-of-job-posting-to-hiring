import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'
import { EmployerSurveyForm } from '@/components/EmployerSurveyForm'

export default function SurveysPage() {
  const [successMessage, setSuccessMessage] = React.useState('')

  const handleSurveySuccess = () => {
    setSuccessMessage('Thank you for your feedback!')
    setTimeout(() => {
      setSuccessMessage('')
    }, 5000)
  }

  return (
    <DashboardLayout>
        <PageHeader
          title="Survey Feedback"
          description="Share your experience with job boards and help us improve the efficiency scoring"
        />

        {successMessage && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Employer Survey Section */}
        <Section title="Employer Survey">
          <Card className="text-gray-300 mb-6">
            <p className="mb-4">
              Your feedback helps us understand job board efficiency from a hiring perspective. This survey takes about 5-10 minutes to complete.
            </p>
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-400">
                <strong>We value your input:</strong> Your responses directly influence our efficiency scoring algorithm, helping employers and job seekers make better decisions about which boards to use.
              </p>
            </div>
          </Card>

          <EmployerSurveyForm onSubmitSuccess={handleSurveySuccess} />
        </Section>

        {/* Survey Info Section */}
        <Section title="About This Survey">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-2">📋 What We Ask</h3>
              <p className="text-gray-400 text-sm">
                Company info, hiring metrics (time to hire, cost), candidate quality assessment, and positioning experience feedback.
              </p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-2">🔒 Your Data</h3>
              <p className="text-gray-400 text-sm">
                All responses are anonymized. We never share individual company data publicly, only aggregate insights.
              </p>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-white mb-2">💡 How It Helps</h3>
              <p className="text-gray-400 text-sm">
                Your feedback improves our scoring algorithm, making the platform more accurate for everyone.
              </p>
            </Card>
          </div>
        </Section>

        {/* FAQ Section */}
        <Section title="Frequently Asked Questions">
          <div className="space-y-4">
            <Card>
              <h4 className="font-semibold text-white mb-2">Why do you need this information?</h4>
              <p className="text-gray-400">
                Employer feedback is crucial for real-world validation of our efficiency scoring. We want to ensure the algorithm reflects actual hiring outcomes.
              </p>
            </Card>

            <Card>
              <h4 className="font-semibold text-white mb-2">Is my company information public?</h4>
              <p className="text-gray-400">
                No. We only use aggregate data in reports. Individual company responses remain confidential.
              </p>
            </Card>

            <Card>
              <h4 className="font-semibold text-white mb-2">Can I submit multiple surveys?</h4>
              <p className="text-gray-400">
                Yes! We encourage you to submit feedback for each job board you use. This helps us build a comprehensive picture.
              </p>
            </Card>

            <Card>
              <h4 className="font-semibold text-white mb-2">How often should I submit surveys?</h4>
              <p className="text-gray-400">
                Submit when you have completed a hiring cycle (successfully hired someone) from a board, or at minimum monthly to track trends.
              </p>
            </Card>

            <Card>
              <h4 className="font-semibold text-white mb-2">What happens with the data?</h4>
              <p className="text-gray-400">
                Data is used to improve our efficiency scores, identify trends in hiring success, and provide insights to job board operators.
              </p>
            </Card>
          </div>
        </Section>
      </DashboardLayout>
    )
  }

