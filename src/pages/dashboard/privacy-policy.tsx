import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'

export default function PrivacyPolicy() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Privacy Policy"
        description="Your privacy is important to us"
      />

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        <Section title="1. Introduction">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Job Board Score ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy
                Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                website and service.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="2. Information We Collect">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                <strong>Information You Voluntarily Provide:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Account registration information (name, email, password)</li>
                <li>Profile information (company name, website, description)</li>
                <li>Payment information (processed securely through Stripe, Paddle, or similar providers)</li>
                <li>Communications with us via email or contact forms</li>
                <li>Feedback, surveys, and customer support inquiries</li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>Information Automatically Collected:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>IP address and browser type</li>
                <li>Pages visited and time spent on each page</li>
                <li>Referral source and exit pages</li>
                <li>Device information (hardware model, operating system)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="3. How We Use Your Information">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and send related information</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, prevent, and address technical and security issues</li>
                <li>Comply with legal obligations and enforce our agreements</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="4. Sharing Your Information">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>
                  <strong>Service Providers:</strong> Third parties who assist us in operating our website and
                  conducting our business (hosting providers, analytics services, payment processors)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, court order, or government request
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                </li>
                <li>
                  <strong>With Your Consent:</strong> For purposes you approve
                </li>
              </ul>

              <p className="text-gray-300">
                We do not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="5. Data Security">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. These measures include encryption,
                secure servers, and access controls. However, no method of transmission over the internet is 100%
                secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="6. Cookies and Tracking Technologies">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                We use cookies and similar tracking technologies to enhance your experience. You can control cookie
                settings through your browser preferences.
              </p>

              <p className="text-gray-300 mb-4">
                <strong>Types of cookies we use:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  <strong>Essential:</strong> Required for site functionality
                </li>
                <li>
                  <strong>Analytics:</strong> To understand how you use our site
                </li>
                <li>
                  <strong>Preferences:</strong> To remember your settings
                </li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="7. Your Rights and Choices">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>

              <p className="text-gray-300">
                To exercise these rights, please contact us at support@joboardscore.com with your request.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="8. Retention of Your Information">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                We retain your personal information for as long as your account is active or as needed to provide our
                services. You can request deletion of your account and associated data at any time, subject to legal
                retention requirements.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="9. Third-Party Links">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Our website may contain links to third-party websites. We are not responsible for the privacy
                practices of these external sites. Please review their privacy policies before providing any personal
                information.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="10. Children's Privacy">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Our services are not directed to children under 13. We do not knowingly collect personal information
                from children under 13. If we become aware of such collection, we will take steps to delete such
                information.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="11. Contact Information">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <p className="text-gray-300">
                Email: support@joboardscore.com
              </p>
            </div>
          </Card>
        </Section>

        <div className="pt-8 flex gap-4">
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
