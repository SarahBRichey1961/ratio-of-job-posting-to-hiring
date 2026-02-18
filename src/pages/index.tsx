import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Job Posting to Hiring Ratio</title>
        <meta name="description" content="Analyze job board efficiency" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Job Posting to Hiring Ratio
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Analyze job board efficiency and hiring trends
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-700 mb-4">
              This dashboard tracks job posting lifespans, repost frequency, and hiring efficiency scores across major job boards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Job Boards</h3>
                <p className="text-gray-600 text-sm mt-2">Track 20-30 major US job boards</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Efficiency Scores</h3>
                <p className="text-gray-600 text-sm mt-2">Weighted scoring algorithm</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Insights</h3>
                <p className="text-gray-600 text-sm mt-2">Weekly trends and reports</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Home
