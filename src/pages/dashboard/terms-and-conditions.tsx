import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PageHeader, Section, Card } from '@/components/DashboardUI'

export default function TermsAndConditions() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Terms and Conditions"
        description="Please read these terms carefully before using our service"
      />

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        <Section title="1. Acceptance of Terms">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                By accessing and using the Take The Reins website and service, you accept and agree to be bound by
                the terms and provision of this agreement. If you do not agree to abide by the above, please do not
                use this service.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="2. Use License">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on
                Take The Reins for personal, non-commercial transitory viewing only. This is the grant of a license,
                not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>
                  Attempt to decompile or reverse engineer any software contained on Take The Reins
                </li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>
                  Transferring the materials to another person or "mirroring" the materials on any other server
                </li>
              </ul>
              <p className="text-gray-300">
                This license shall automatically terminate if you violate any of these restrictions and may be
                terminated by Take The Reins at any time. Upon terminating your viewing of these materials or upon
                the termination of this license, you must destroy any downloaded materials in your possession whether
                in electronic or printed format.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="3. Disclaimer">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                The materials on Take The Reins are provided "as is". Take The Reins makes no warranties, expressed
                or implied, and hereby disclaims and negates all other warranties including, without limitation, implied
                warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of
                intellectual property or other violation of rights.
              </p>
              <p className="text-gray-300">
                Further, Take The Reins does not warrant or make any representations concerning the accuracy,
                likely results, or reliability of the use of the materials on its website or otherwise relating to
                such materials or on any sites linked to this site.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="4. Limitations">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                In no event shall Take The Reins or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the
                use or inability to use the materials on Take The Reins, even if Take The Reins or an authorized
                representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="5. Accuracy of Materials">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                The materials appearing on Take The Reins could include technical, typographical, or photographic
                errors. Take The Reins does not warrant that any of the materials on its website are accurate,
                complete, or current. Take The Reins may make changes to the materials contained on its website at
                any time without notice. However, Take The Reins does not make any commitment to update the materials.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="6. Links">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Take The Reins has not reviewed all of the sites linked to its website and is not responsible for
                the contents of any such linked site. The inclusion of any link does not imply endorsement by Take The
                Reins of the site. Use of any such linked website is at the user's own risk.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="7. Modifications">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                Take The Reins may revise these terms of service for its website at any time without notice. By using
                this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="8. Governing Law">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">
                These terms and conditions are governed by and construed in accordance with the laws of the United
                States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="9. User Accounts">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you create an account on Take The Reins, you are responsible for maintaining the confidentiality
                of your account and password and for restricting access to your computer. You agree to accept
                responsibility for all activities that occur under your account or password.
              </p>
              <p className="text-gray-300">
                You must notify Take The Reins immediately of any unauthorized use of your account or any other
                breaches of security.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="10. User Content">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                Any content you submit, post, or display on or through Take The Reins is at your own risk. You retain
                all rights to any content you submit, post or display on or through Take The Reins and you are
                responsible for the consequences of its submission or publication.
              </p>
              <p className="text-gray-300">
                By submitting content to Take The Reins, you grant us a worldwide, non-exclusive, royalty-free
                license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute
                such content in any media or medium.
              </p>
            </div>
          </Card>
        </Section>

        <Section title="11. Contact Information">
          <Card>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 mb-4">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <p className="text-gray-300">
                Email: support@takethereins.com
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
