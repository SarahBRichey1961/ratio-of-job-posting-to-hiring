import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function TakeTheReins() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Head>
        <title>Take The Reins - Your Pathway Forward</title>
        <meta name="description" content="Take control of your career pathway. Create a framework, collaborate on your approach, build your manifesto." />
      </Head>

      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Take The Reins</h1>
          <div className="flex gap-6">
            <Link href="https://jobboardscores.netlify.app/dashboard/comparison" target="_blank" className="text-slate-300 hover:text-white transition">
              Job Board Comparison
            </Link>
            <Link href="/explore" className="text-slate-300 hover:text-white transition">
              Explore
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Take The Reins
          </h2>
          <p className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto">
            Facilitate your own pathway forward—unemployed or career-changing, you're in control.
          </p>
        </div>

        {/* Three Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Pillar 1: Framework */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-600/20 rounded-lg mb-6">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Create a Framework for Your Idea
            </h3>
            <p className="text-slate-400">
              Define your vision, identify your goals, and map out the steps to get there. Build on ideas that matter to you.
            </p>
          </div>

          {/* Pillar 2: Collaborate */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-600/20 rounded-lg mb-6">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 10H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Collaborate on the Approach
            </h3>
            <p className="text-slate-400">
              Connect with mentors, peers, and experts. Get feedback, share ideas, and learn from the community.
            </p>
          </div>

          {/* Pillar 3: Manifesto */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:bg-slate-800/70 transition">
            <div className="flex items-center justify-center w-12 h-12 bg-rose-600/20 rounded-lg mb-6">
              <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25c0 5.079 3.855 9.26 8.756 9.589M12 6.253c5.5 0 10 4.745 10 10.997 0 5.079-3.855 9.26-8.756 9.589m0 0A8.991 8.991 0 0121 12a8.991 8.991 0 01-8.756 8.589" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Build Your Manifesto
            </h3>
            <p className="text-slate-400">
              Speak in your own way about you, not a resume. Give mind bending examples of who you are, what you have done and your aim for this new phase ahead.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-16">
          <Link
            href="/hub/projects"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg transition"
          >
            Explore Community
          </Link>
        </div>

        {/* Info Section */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 sm:p-12">
          <h3 className="text-2xl font-bold text-white mb-6">
            How TakeTheReins Works
          </h3>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong>For Job Seekers:</strong> Whether you're unemployed or career-changing, use TakeTheReins to take control of your pathway. Find opportunities aligned with your skills, connect with mentors, ask questions, and build a manifesto that represents who you are.
            </p>
            <p>
              <strong>For Mentors:</strong> Share your expertise, guide others, and build impact in a community focused on real growth and collaboration.
            </p>
            <p>
              <strong>For Employers:</strong> Connect with pre-vetted, passionate talent. Post jobs, discover candidates, and hire people ready to make an impact.
            </p>
          </div>
        </div>


      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-slate-500 text-sm">
          <p>Take The Reins © 2026 • Empowering your own pathway forward</p>
        </div>
      </footer>
    </div>
  )
}
