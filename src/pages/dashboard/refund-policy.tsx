import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'

export default function RefundPolicy() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Refund Policy"
        description="Our refund policy and withdrawal rights"
      />

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        <Section title="Overview">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Thank you for purchasing services from Take The Reins. This refund policy outlines when you may be 
                entitled to withdraw a transaction and/or receive a refund, and how to request one.
              </p>
              <p className="text-gray-300">
                If local consumer protection laws provide you with rights that are more favorable than this policy, 
                those rights will apply. Nothing in this policy limits your mandatory consumer rights.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="1. Global Refund Policy">
          <Card>
            <div className="prose prose-invert max-w-none">
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>
                  <strong>Non-Refundable Transactions:</strong> Unless required by applicable law, all transactions are 
                  non-refundable and non-exchangeable.
                </li>
                <li>
                  <strong>Discretionary Refunds:</strong> Take The Reins may issue refunds on a discretionary basis or 
                  if you exercise an applicable statutory withdrawal right.
                </li>
                <li>
                  <strong>Fraud Prevention:</strong> Refunds will not be issued where there is evidence of fraud, refund 
                  abuse, or other manipulative behavior.
                </li>
                <li>
                  <strong>Access Termination:</strong> If you receive a refund, access to the relevant service will 
                  cease immediately.
                </li>
                <li>
                  <strong>Request Timeline:</strong> Refund requests must be made within the applicable statutory or 
                  discretionary period.
                </li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="2. Country-Specific Withdrawal Rights">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                <strong>European Union / EEA / Switzerland / United Kingdom:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>14-day statutory withdrawal right from digital content and service contracts</li>
                <li>Applies to first payments and one-off purchases</li>
                <li>Does not apply to subsequent subscription payments (except for annual UK subscriptions)</li>
                <li>Does not apply to partially consumed digital content when you've consented to waive withdrawal rights</li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>Turkey & Israel:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>14-day statutory withdrawal right from digital content and service contracts</li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>South Korea, Brazil, China & Canada:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>7-day unconditional right to cancel digital services and receive a full refund</li>
              </ul>

              <p className="text-gray-300">
                <strong>Singapore:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>5-day unconditional right to cancel digital services and receive a full refund</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="3. How to Request a Refund or Withdrawal">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4 font-semibold">
                To withdraw, cancel, and/or request a refund, contact support:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Email: support@takethereins.com</li>
                <li>Reference your transaction or receipt details</li>
                <li>Clearly state the reason for your refund request</li>
              </ul>

              <p className="text-gray-300 mb-4">
                <strong>Processing:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Refunds will be processed using the same payment method where possible</li>
                <li>Processing occurs within 14 days of approval</li>
                <li>Your transaction records will be reviewed to verify eligibility</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="4. Subscription Cancellation">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                You may cancel your subscription at any time to prevent future billing:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>No further payments will be taken after cancellation</li>
                <li>This does not affect your eligibility for withdrawal rights during statutory periods</li>
              </ul>

              <p className="text-gray-300">
                To cancel, contact support@takethereins.com at any time.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="5. Technical or Product Defects">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you experience persistent technical issues or material defects that prevent access to services as 
                described:
              </p>
              <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
                <li>Contact our support team at support@takethereins.com</li>
                <li>Provide detailed information about the issue</li>
                <li>Allow us to attempt to resolve the issue first</li>
                <li>If unresolved, you may be eligible for a refund</li>
              </ol>

              <p className="text-gray-300">
                Where there is evidence of a material technical defect, refunds will be issued in accordance with 
                applicable consumer protection laws.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="6. Discretionary Refunds">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Take The Reins may, at its sole discretion, issue a refund if requested within 14 days of your 
                transaction date. Such requests are reviewed on a case-by-case basis.
              </p>
              <p className="text-gray-300 mb-4">
                We may consider factors including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>The nature of the service</li>
                <li>The reason for your request</li>
                <li>Usage or consumption of the service</li>
                <li>Any applicable contractual terms</li>
              </ul>

              <p className="text-gray-300">
                We may approve a refund in full, approve a partial refund, or decline the request. Any discretionary 
                refund is voluntary and does not create an obligation to provide refunds in the future.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="7. Add-Ons and One-Time Transactions">
          <Card>
            <div className="prose prose-invert max-w-none">
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Refund eligibility for add-ons and one-time transactions follows the same criteria as primary transactions</li>
                <li>Add-ons expire when the main subscription ends unless otherwise stated</li>
                <li>Items delivered and fully accessible immediately may be non-refundable once delivered (except where required by law)</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="8. Chargebacks and Payment Disputes">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                We encourage you to contact us before raising a chargeback or payment dispute:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Contact support@takethereins.com first</li>
                <li>Allow us to resolve the matter</li>
                <li>This helps avoid service suspension and faster resolution</li>
              </ul>

              <p className="text-gray-300 mb-4">
                If you initiate a chargeback or payment dispute, your access to services may be temporarily suspended 
                while we review the matter. This does not affect your lawful rights to dispute a charge under applicable law.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="9. Consumer Rights Protection">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                This policy does not affect your consumer rights in relation to services that are:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Not as described</li>
                <li>Faulty or defective</li>
                <li>Not fit for the purpose described</li>
              </ul>
            </div>
          </Card>
        </Section>

        <Section title="10. Policy Updates">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Take The Reins may update this policy at any time. The policy in effect at the time of your transaction 
                governs that transaction.
              </p>
              <p className="text-gray-300">
                We recommend saving or printing a copy of this policy for your records.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="Contact & Support">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                For questions about this refund policy or to request a refund:
              </p>
              <p className="text-gray-300 font-semibold">
                Email: support@takethereins.com
              </p>
              <p className="text-gray-300 mt-4 text-sm">
                Last Updated: March 18, 2026
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
