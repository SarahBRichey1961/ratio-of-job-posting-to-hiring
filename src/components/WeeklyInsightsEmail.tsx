import React from 'react'

interface TemplateProps {
  recipientName: string
  topBoards: Array<{
    boardId: number
    boardName: string
    currentScore: number
    previousScore: number
    scoreChange: number
    percentageChange: number
    trend: 'rising' | 'declining' | 'stable'
    surveyDataPoints: {
      employerSurveys: number
      candidateSurveys: number
      avgEmployerSatisfaction: number
      avgCandidateSatisfaction: number
    }
  }>
  risingBoards: Array<{
    boardId: number
    boardName: string
    currentScore: number
    scoreChange: number
    percentageChange: number
  }>
  decliningBoards: Array<{
    boardId: number
    boardName: string
    currentScore: number
    scoreChange: number
    percentageChange: number
  }>
  insights: Array<{
    title: string
    description: string
    recommendation: string
  }>
  surveyStats: {
    weeklyEmployerSurveys: number
    weeklyCandidateSurveys: number
  }
}

export const WeeklyInsightsEmail: React.FC<TemplateProps> = ({
  recipientName,
  topBoards,
  risingBoards,
  decliningBoards,
  insights,
  surveyStats,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 32px 20px;
        }
        .greeting {
          margin-bottom: 24px;
          font-size: 16px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 8px;
        }
        .board-card {
          background-color: #f3f4f6;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          border-left: 4px solid #667eea;
        }
        .board-card.trending {
          border-left-color: #10b981;
        }
        .board-card.declining {
          border-left-color: #ef4444;
        }
        .board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .board-name {
          font-size: 16px;
          font-weight: 600;
          color: #111;
        }
        .score {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
        }
        .trend-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .trend-badge.rising {
          background-color: #d1fae5;
          color: #065f46;
        }
        .trend-badge.declining {
          background-color: #fee2e2;
          color: #7f1d1d;
        }
        .trend-badge.stable {
          background-color: #fef3f2;
          color: #7f2620;
        }
        .board-stats {
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .stat {
          display: flex;
          justify-content: space-between;
        }
        .insight {
          background-color: #f0f4ff;
          border-left: 4px solid #667eea;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
        .insight-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 8px;
          color: #111;
        }
        .insight-description {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .insight-recommendation {
          font-size: 13px;
          font-weight: 500;
          color: #667eea;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-box {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 6px;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cta-button {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
          font-size: 14px;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 24px 0;
        }
        .trend-change {
          font-weight: 600;
        }
        .trend-change.up {
          color: #10b981;
        }
        .trend-change.down {
          color: #ef4444;
        }
      `}</style>
    </head>
    <body>
      <div style={{ padding: '20px', backgroundColor: '#f9fafb' }}>
        <div className="container">
          {/* Header */}
          <div className="header">
            <h1>📊 Weekly Job Board Insights</h1>
            <p>Your comprehensive analysis of job board performance</p>
          </div>

          {/* Main Content */}
          <div className="content">
            {/* Greeting */}
            <div className="greeting">
              <p>Hi {recipientName},</p>
              <p>
                Here's your weekly summary of job board performance, trending platforms,
                and key insights to help you understand the latest hiring market trends.
              </p>
            </div>

            {/* Survey Activity Stats */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{surveyStats.weeklyEmployerSurveys}</div>
                <div className="stat-label">New Employer Surveys</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{surveyStats.weeklyCandidateSurveys}</div>
                <div className="stat-label">New Candidate Surveys</div>
              </div>
            </div>

            {/* Key Insights */}
            {insights.length > 0 && (
              <div className="section">
                <div className="section-title">💡 Key Insights</div>
                {insights.map((insight, idx) => (
                  <div key={idx} className="insight">
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-description">{insight.description}</div>
                    <div className="insight-recommendation">
                      ✓ {insight.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Top Performing Boards */}
            {topBoards.length > 0 && (
              <div className="section">
                <div className="section-title">⭐ Top Performing Boards</div>
                {topBoards.map((board) => (
                  <div key={board.boardId} className="board-card">
                    <div className="board-header">
                      <span className="board-name">{board.boardName}</span>
                      <span className="score">{board.currentScore}/100</span>
                    </div>
                    <div className="board-stats">
                      <div className="stat">
                        <span>Previous: {board.previousScore}/100</span>
                      </div>
                      <div className="stat">
                        <span className={`trend-change ${board.scoreChange > 0 ? 'up' : 'down'}`}>
                          {board.scoreChange > 0 ? '+' : ''}{board.scoreChange}pts
                        </span>
                      </div>
                      <div className="stat">
                        <span>{board.surveyDataPoints.employerSurveys} employer surveys</span>
                      </div>
                      <div className="stat">
                        <span>{board.surveyDataPoints.candidateSurveys} candidate surveys</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rising Boards */}
            {risingBoards.length > 0 && (
              <div className="section">
                <div className="section-title">📈 Rising Stars</div>
                {risingBoards.map((board) => (
                  <div key={board.boardId} className="board-card trending">
                    <div className="board-header">
                      <span className="board-name">{board.boardName}</span>
                      <span className="trend-badge rising">
                        ↑ +{board.scoreChange}pts
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 500 }}>
                      {board.currentScore}/100 • {board.percentageChange}% improvement
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Declining Boards */}
            {decliningBoards.length > 0 && (
              <div className="section">
                <div className="section-title">📉 Boards Needing Attention</div>
                {decliningBoards.map((board) => (
                  <div key={board.boardId} className="board-card declining">
                    <div className="board-header">
                      <span className="board-name">{board.boardName}</span>
                      <span className="trend-badge declining">
                        ↓ {board.scoreChange}pts
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>
                      {board.currentScore}/100 • {board.percentageChange}% decline
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <a
                href="https://job-board-scorer.example.com/dashboard"
                className="cta-button"
              >
                View Full Dashboard →
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p style={{ margin: 0 }}>
              © 2026 Job Board Scorer. All rights reserved.
            </p>
            <p style={{ margin: '8px 0 0 0' }}>
              You're receiving this email because you're subscribed to weekly insights.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
)
