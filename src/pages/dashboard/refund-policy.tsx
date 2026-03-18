import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'

export default function RefundPolicy() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Refund Policy"
        description="Our refund and refund cancellation policy"
      />

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        <Section title="Overview">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Job Board Score is committed to customer satisfaction. This refund policy outlines how we handle
                refunds for subscription plans and one-time purchases.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Refund Eligibility">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                <strong>Monthly and Annual Subscriptions:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>
                  Full refund available within 30 days of initial purchase if you request cancellation
                </li>
                <li>
                  After 30 days, you can cancel your subscription at any time, with no additional charges for the
                  following billing cycle
                </li>
                <li>
                  Partial refunds for the current billing period are not available unless required by applicable law
                </li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>One-Time Purchases:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  Full refund available within 30 days of purchase if the service was not used
                </li>
                <li>
                  After 30 days, one-time purchases are generally non-refundable unless there is a service failure or
                  technical issue
                </li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="Subscription Cancellation">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                You can cancel your subscription at any time through your account settings. Upon cancellation:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Your access continues through the end of your current billing period</li>
                <li>You will not be charged for the next billing cycle</li>
                <li>You can reactivate your subscription at any time</li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>Refund Request Process:</strong>
              </p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2">
                <li>
                  Log into your account and navigate to your subscription settings, or
                </li>
                <li>
                  Contact our support team at support@joboardscore.com with your request
                </li>
                <li>
                  Provide your account email and reason for the refund request
                </li>
                <li>
                  We will review your request and respond within 5-10 business days
                </li>
              </ol>
            </div>
          </Card>
        </Section>

        <Section title="Non-Refundable Items">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                The following are non-refundable unless required by law:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Services that have been fully accessed or consumed</li>
                <li>Purchases made more than 30 days ago (unless specified otherwise)</li>
                <li>Charges for services canceled due to user violation of terms of service</li>
                <li>Any promotional or discounted purchases (unless otherwise stated in the promotion)</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="Refund Exceptions">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                We may refuse or delay a refund if:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>The request is made on behalf of another person without authorization</li>
                <li>Repeated refund requests are made in a pattern we deem abusive</li>
                <li>The user's account was used in violation of our Terms and Conditions</li>
                <li>The purchase was made using fraudulent payment methods</li>
              </ul>

              <p className="text-gray-300">
                In such cases, we will contact you to discuss your refund request.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Payment Method Refunds">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Refunds will be credited back to the original payment method used for the purchase. Depending on your
                financial institution, it may take 5-10 business days for the refund to appear in your account. Refund
                processing times are dependent on your payment provider and are outside our control.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Service Issues and Credits">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you experience technical issues or service failures, we will:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Work with you to resolve the issue as quickly as possible</li>
                <li>
                  Provide service credits for downtime if the issue was on our end
                </li>
                <li>
                  Offer a full or partial refund if the issue cannot be resolved
                </li>
              </ul>

              <p className="text-gray-300">
                Please report any service issues to support@joboardscore.com immediately.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="International Refunds">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Customers in the European Union and other jurisdictions with consumer protection laws may be entitled
                to additional rights beyond this policy. We comply with all applicable local and international
                consumer protection regulations.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Contact Us">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you have questions about our refund policy or would like to request a refund, please contact:
              </p>
              <p className="text-gray-300">
                Email: support@joboardscore.com
              </p>
              <p className="text-gray-300 mt-4">
                We will respond to all refund requests within 5 business days.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Policy Changes">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Job Board Score reserves the right to modify this refund policy at any time. Changes will be effective
                immediately upon posting to our website. Continued use of our service after changes constitutes
                acceptance of the updated policy.
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
