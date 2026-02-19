import React from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  Section,
  Card,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Insights & Analytics"
        description="Market trends, role analysis, and strategic recommendations"
      />

      {/* Market Trends */}
      <Section title="Market Trends">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-white mb-4">🚀 Rising Opportunities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">ML/AI Roles</p>
                  <p className="text-gray-400 text-sm">+48% new postings this month</p>
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">DevOps Engineers</p>
                  <p className="text-gray-400 text-sm">+32% new postings this month</p>
                </div>
                <span className="text-2xl">📈</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Security Engineers</p>
                  <p className="text-gray-400 text-sm">+28% new postings this month</p>
                </div>
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-white mb-4">📉 Declining Opportunities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">QA Automation</p>
                  <p className="text-gray-400 text-sm">-18% fewer postings</p>
                </div>
                <span className="text-2xl">📉</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Business Analysts</p>
                  <p className="text-gray-400 text-sm">-12% fewer postings</p>
                </div>
                <span className="text-2xl">📉</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Web Developers</p>
                  <p className="text-gray-400 text-sm">-8% fewer postings</p>
                </div>
                <span className="text-2xl">📉</span>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Industry Analysis */}
      <Section title="Industry Performance Comparison">
        <StatsSection>
          <MetricCard
            label="Tech Industry"
            value="78"
            subtitle="12 boards, 8,450 jobs"
            trend="up"
            trendValue="+5.2%"
            icon="💻"
          />
          <MetricCard
            label="Remote Focus"
            value="71"
            subtitle="5 boards, 2,134 jobs"
            trend="stable"
            trendValue="No change"
            icon="🌍"
          />
          <MetricCard
            label="General Boards"
            value="65"
            subtitle="10 boards, 5,234 jobs"
            trend="down"
            trendValue="-2.3%"
            icon="📋"
          />
          <MetricCard
            label="Niche Boards"
            value="42"
            subtitle="6 boards, 1,234 jobs"
            trend="stable"
            trendValue="No change"
            icon="🎯"
          />
        </StatsSection>
      </Section>

      {/* Recommendations */}
      <Section title="Strategic Recommendations">
        <div className="space-y-4">
          <Card>
            <div className="flex gap-4">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">For Job Seekers</h4>
                <p className="text-gray-400 text-sm">
                  ML/AI and DevOps roles are hot right now with the fastest hiring times (11-13 days).
                  These boards are also very clean with low repost rates. Post on Stack Overflow and
                  GitHub Jobs for maximum visibility.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">For Recruiters</h4>
                <p className="text-gray-400 text-sm">
                  Tech-focused boards (score 78) attract the most qualified candidates with 40%
                  faster hiring cycles than general boards. Consider prioritizing Stack Overflow,
                  GitHub, and LinkedIn for your tech roles.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex gap-4">
              <div className="text-3xl">📊</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">For Product Teams</h4>
                <p className="text-gray-400 text-sm">
                  Data quality is excellent (92.1% duplication-free), but posting lifespan varies
                  from 11-35 days depending on board. Focus on high-efficiency boards to improve
                  overall candidate experience and reduce time-to-hire.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* Comparative Analysis */}
      <Section title="Board Positioning">
        <Card>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4">🏆 High Quality & Fast</h4>
              <ul className="space-y-2">
                <li className="text-gray-300">✓ Stack Overflow (88, 12d)</li>
                <li className="text-gray-300">✓ GitHub Jobs (84, 13d)</li>
                <li className="text-gray-300">✓ HackerNews (82, 11d)</li>
              </ul>
              <p className="text-gray-500 text-sm mt-4">Best for tech-focused hiring</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">📊 Volume & Reach</h4>
              <ul className="space-y-2">
                <li className="text-gray-300">✓ LinkedIn (85, 5432 jobs)</li>
                <li className="text-gray-300">✓ Indeed (72, 3200 jobs)</li>
                <li className="text-gray-300">✓ Glassdoor (68, 2890 jobs)</li>
              </ul>
              <p className="text-gray-500 text-sm mt-4">Best for broad reach</p>
            </div>
          </div>
        </Card>
      </Section>
    </DashboardLayout>
  )
}
