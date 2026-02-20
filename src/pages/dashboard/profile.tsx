import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  PageHeader,
  Card,
  Section,
  MetricCard,
  StatsSection,
} from '@/components/DashboardUI'

interface BoardProfile {
  name: string
  score: number
  grade: string
  lifespan: number
  repostRate: number
  totalPostings: number
  topRoles: Array<{ name: string; count: number }>
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  scoreBreakdown: {
    lifespan: number
    reposts: number
    employer: number
    candidate: number
  }
  dataQuality: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { board: boardParam } = router.query

  // Mock profiles data (moved outside to avoid recalculation)
  const mockProfiles: Record<string, BoardProfile> = {
      'stack-overflow': {
        name: 'Stack Overflow',
        score: 88,
        grade: 'A+',
        lifespan: 12,
        repostRate: 3,
        totalPostings: 2456,
        topRoles: [
          { name: 'Software Engineer', count: 1842 },
          { name: 'DevOps Engineer', count: 287 },
          { name: 'ML Engineer', count: 156 },
          { name: 'Full Stack Developer', count: 123 },
          { name: 'Backend Engineer', count: 48 },
        ],
        trend: 'up',
        trendValue: 5.2,
        strengths: [
          'Exceptional data quality (97%)',
          'Fastest average hiring (12 days)',
          'Strong tech talent pool',
          'Minimal duplicate postings',
          'Excellent employer reputation',
        ],
        weaknesses: [
          'Premium pricing',
          'Tech-only focus',
          'Smaller non-tech talent pool',
        ],
        recommendations: [
          'Primary channel for tech roles',
          'Excellent for senior engineers',
          'Best ROI for long-term hiring',
          'Combine with LinkedIn for broader reach',
        ],
        scoreBreakdown: {
          lifespan: 35,
          reposts: 30,
          employer: 19,
          candidate: 4,
        },
        dataQuality: 97,
      },
      'linkedin': {
        name: 'LinkedIn',
        score: 85,
        grade: 'A',
        lifespan: 14,
        repostRate: 5,
        totalPostings: 5432,
        topRoles: [
          { name: 'Product Manager', count: 2145 },
          { name: 'Software Engineer', count: 1876 },
          { name: 'Data Scientist', count: 654 },
          { name: 'Sales Engineer', count: 432 },
          { name: 'Manager', count: 325 },
        ],
        trend: 'up',
        trendValue: 3.1,
        strengths: [
          'Largest talent pool (5432 jobs)',
          'Excellent employer branding',
          'Good for all role types',
          'Professional network leverage',
        ],
        weaknesses: [
          'Higher repost rate (5%)',
          'Can be slower to fill (14 days)',
          'More competition',
        ],
        recommendations: [
          'Best for broad reach',
          'Essential for all hiring',
          'Excellent for brand building',
          'Consider premium features',
        ],
        scoreBreakdown: {
          lifespan: 32,
          reposts: 28,
          employer: 20,
          candidate: 5,
        },
        dataQuality: 95,
      },
      'github-jobs': {
        name: 'GitHub Jobs',
        score: 84,
        grade: 'A',
        lifespan: 13,
        repostRate: 4,
        totalPostings: 1834,
        topRoles: [
          { name: 'Software Engineer', count: 1456 },
          { name: 'DevOps Engineer', count: 234 },
          { name: 'Security Engineer', count: 89 },
          { name: 'Site Reliability Engineer', count: 55 },
        ],
        trend: 'up',
        trendValue: 2.8,
        strengths: [
          'Developer-focused audience',
          'High-quality applicants',
          'Clean data (96%)',
          'Growing platform',
        ],
        weaknesses: [
          'Smaller pool than LinkedIn',
          'Limited non-tech roles',
          'Newer platform (less brand recognition)',
        ],
        recommendations: [
          'Go-to for developers',
          'Excellent technical talent quality',
          'Worth premium investment',
        ],
        scoreBreakdown: {
          lifespan: 34,
          reposts: 29,
          employer: 18,
          candidate: 3,
        },
        dataQuality: 96,
      },
      'indeed': {
        name: 'Indeed',
        score: 72,
        grade: 'B',
        lifespan: 18,
        repostRate: 12,
        totalPostings: 3200,
        topRoles: [
          { name: 'Software Engineer', count: 1230 },
          { name: 'Sales', count: 654 },
          { name: 'Warehouse', count: 432 },
          { name: 'Support', count: 345 },
        ],
        trend: 'down',
        trendValue: -2.3,
        strengths: [
          'Large job pool (3200)',
          'Good for non-tech roles',
          'Established platform',
        ],
        weaknesses: [
          'Data quality concerns (88%)',
          'Slower hiring (18 days)',
          'High duplicate rate (12%)',
          'Mixed quality of applicants',
        ],
        recommendations: [
          'Best for volume hiring',
          'Include for broader reach',
          'Monitor quality of applicants',
          'Budget for higher screening time',
        ],
        scoreBreakdown: {
          lifespan: 25,
          reposts: 23,
          employer: 18,
          candidate: 6,
        },
        dataQuality: 88,
      },
      'hackernews': {
        name: 'HackerNews',
        score: 82,
        grade: 'A',
        lifespan: 11,
        repostRate: 2,
        totalPostings: 1245,
        topRoles: [
          { name: 'Software Engineer', count: 987 },
          { name: 'DevOps Engineer', count: 156 },
          { name: 'ML Engineer', count: 102 },
        ],
        trend: 'up',
        trendValue: 3.5,
        strengths: [
          'High-quality tech audience',
          'Minimal reposting (2%)',
          'Fast hiring cycle',
          'Strong founder interest',
        ],
        weaknesses: [
          'Limited visibility',
          'Small overall pool',
          'Tech-only focus',
        ],
        recommendations: [
          'Excellent for early-stage companies',
          'Great for startup visibility',
          'Pair with other tech boards',
        ],
        scoreBreakdown: {
          lifespan: 33,
          reposts: 31,
          employer: 17,
          candidate: 1,
        },
        dataQuality: 94,
      },
      'we-work-remotely': {
        name: 'We Work Remotely',
        score: 74,
        grade: 'B+',
        lifespan: 15,
        repostRate: 6,
        totalPostings: 1567,
        topRoles: [
          { name: 'Product Manager', count: 234 },
          { name: 'Software Engineer', count: 876 },
          { name: 'Designer', count: 298 },
        ],
        trend: 'up',
        trendValue: 4.2,
        strengths: [
          'Established remote-first platform',
          'Quality remote positions',
          'Growing user base',
        ],
        weaknesses: [
          'Premium pricing',
          'Moderate repost rate',
        ],
        recommendations: [
          'Best for remote-first roles',
          'Growing platform with good reach',
        ],
        scoreBreakdown: {
          lifespan: 29,
          reposts: 27,
          employer: 16,
          candidate: 2,
        },
        dataQuality: 90,
      },
      'glassdoor': {
        name: 'Glassdoor',
        score: 68,
        grade: 'B',
        lifespan: 20,
        repostRate: 14,
        totalPostings: 2890,
        topRoles: [
          { name: 'Software Engineer', count: 1456 },
          { name: 'Sales', count: 687 },
          { name: 'HR', count: 523 },
        ],
        trend: 'stable',
        trendValue: 0.1,
        strengths: [
          'Large pool of candidates',
          'Good for employer branding',
          'Integrated reviews platform',
        ],
        weaknesses: [
          'High duplicate rate (14%)',
          'Slower hiring process',
          'Mixed data quality',
        ],
        recommendations: [
          'Use for employer branding',
          'Combine with other boards',
        ],
        scoreBreakdown: {
          lifespan: 24,
          reposts: 21,
          employer: 18,
          candidate: 5,
        },
        dataQuality: 82,
      },
      'ziprecruiter': {
        name: 'ZipRecruiter',
        score: 65,
        grade: 'B-',
        lifespan: 22,
        repostRate: 18,
        totalPostings: 3100,
        topRoles: [
          { name: 'Sales', count: 912 },
          { name: 'Warehouse', count: 645 },
          { name: 'Customer Service', count: 534 },
        ],
        trend: 'down',
        trendValue: -1.8,
        strengths: [
          'Large candidate pool',
          'Good for non-tech roles',
        ],
        weaknesses: [
          'High repost rate (18%)',
          'Candidate quality concerns',
          'Spam applicants',
        ],
        recommendations: [
          'Use for volume roles',
          'Budget extra screening time',
        ],
        scoreBreakdown: {
          lifespan: 18,
          reposts: 15,
          employer: 18,
          candidate: 14,
        },
        dataQuality: 76,
      },
      'remotive': {
        name: 'Remotive',
        score: 63,
        grade: 'B-',
        lifespan: 16,
        repostRate: 8,
        totalPostings: 1034,
        topRoles: [
          { name: 'Customer Support', count: 345 },
          { name: 'Software Engineer', count: 234 },
          { name: 'Marketing', count: 198 },
        ],
        trend: 'stable',
        trendValue: 0.5,
        strengths: [
          'Specialized remote platform',
          'Community-focused',
        ],
        weaknesses: [
          'Smaller pool',
          'Niche audience',
        ],
        recommendations: [
          'Good secondary remote channel',
        ],
        scoreBreakdown: {
          lifespan: 24,
          reposts: 19,
          employer: 12,
          candidate: 8,
        },
        dataQuality: 87,
      },
      'remoteok': {
        name: 'RemoteOK',
        score: 62,
        grade: 'C+',
        lifespan: 17,
        repostRate: 9,
        totalPostings: 892,
        topRoles: [
          { name: 'Software Engineer', count: 456 },
          { name: 'Marketing', count: 234 },
          { name: 'Design', count: 178 },
        ],
        trend: 'up',
        trendValue: 2.1,
        strengths: [
          'Growing remote platform',
          'Global reach',
        ],
        weaknesses: [
          'Moderate data quality',
          'Smaller audience',
        ],
        recommendations: [
          'Include as secondary remote option',
        ],
        scoreBreakdown: {
          lifespan: 22,
          reposts: 18,
          employer: 13,
          candidate: 9,
        },
        dataQuality: 80,
      },
      'the-muse': {
        name: 'The Muse',
        score: 60,
        grade: 'C+',
        lifespan: 19,
        repostRate: 11,
        totalPostings: 756,
        topRoles: [
          { name: 'Product Manager', count: 234 },
          { name: 'Designer', count: 198 },
          { name: 'Marketing', count: 176 },
        ],
        trend: 'stable',
        trendValue: -0.3,
        strengths: [
          'Quality career content',
          'Good for company culture fit',
        ],
        weaknesses: [
          'Smaller pool',
          'Moderate traffic',
        ],
        recommendations: [
          'Use for culture-focused hiring',
        ],
        scoreBreakdown: {
          lifespan: 21,
          reposts: 15,
          employer: 14,
          candidate: 10,
        },
        dataQuality: 78,
      },
      'careerbuilder': {
        name: 'CareerBuilder',
        score: 58,
        grade: 'C',
        lifespan: 24,
        repostRate: 16,
        totalPostings: 2345,
        topRoles: [
          { name: 'Sales', count: 654 },
          { name: 'Administrative', count: 432 },
          { name: 'Support', count: 389 },
        ],
        trend: 'down',
        trendValue: -3.2,
        strengths: [
          'Large general job pool',
          'Established platform',
        ],
        weaknesses: [
          'Declining platform',
          'High repost rate',
          'Older candidate base',
        ],
        recommendations: [
          'Use as secondary channel',
          'Better for mature workforce',
        ],
        scoreBreakdown: {
          lifespan: 15,
          reposts: 12,
          employer: 18,
          candidate: 13,
        },
        dataQuality: 74,
      },
      'hired': {
        name: 'Hired',
        score: 57,
        grade: 'C',
        lifespan: 14,
        repostRate: 7,
        totalPostings: 567,
        topRoles: [
          { name: 'Software Engineer', count: 456 },
          { name: 'Data Scientist', count: 89 },
          { name: 'Product Manager', count: 22 },
        ],
        trend: 'stable',
        trendValue: 0.8,
        strengths: [
          'Pre-vetted candidates',
          'Good quality matches',
        ],
        weaknesses: [
          'Commission-based model',
          'Smaller pool',
          'Limited candidates',
        ],
        recommendations: [
          'Good for selective hiring',
          'Premium quality candidates',
        ],
        scoreBreakdown: {
          lifespan: 23,
          reposts: 17,
          employer: 11,
          candidate: 6,
        },
        dataQuality: 92,
      },
      'flexjobs': {
        name: 'FlexJobs',
        score: 56,
        grade: 'C',
        lifespan: 18,
        repostRate: 5,
        totalPostings: 423,
        topRoles: [
          { name: 'Virtual Assistant', count: 123 },
          { name: 'Content Writer', count: 98 },
          { name: 'Customer Service', count: 87 },
        ],
        trend: 'stable',
        trendValue: 1.2,
        strengths: [
          'Scammed-free platform',
          'Quality remote roles',
        ],
        weaknesses: [
          'Small pool',
          'Limited tech roles',
          'Premium model',
        ],
        recommendations: [
          'Niche remote platform',
        ],
        scoreBreakdown: {
          lifespan: 18,
          reposts: 20,
          employer: 10,
          candidate: 8,
        },
        dataQuality: 89,
      },
      'angellist': {
        name: 'AngelList',
        score: 54,
        grade: 'C',
        lifespan: 12,
        repostRate: 4,
        totalPostings: 234,
        topRoles: [
          { name: 'Software Engineer', count: 156 },
          { name: 'Product Manager', count: 45 },
          { name: 'Data Scientist', count: 33 },
        ],
        trend: 'down',
        trendValue: -2.5,
        strengths: [
          'Startup community',
          'Founder interest',
        ],
        weaknesses: [
          'Declining platform',
          'Limited current activity',
          'Smaller pool',
        ],
        recommendations: [
          'Useful for startups',
          'Limited mainstream use',
        ],
        scoreBreakdown: {
          lifespan: 16,
          reposts: 14,
          employer: 12,
          candidate: 12,
        },
        dataQuality: 81,
      },
      'remote.co': {
        name: 'Remote.co',
        score: 52,
        grade: 'D',
        lifespan: 21,
        repostRate: 13,
        totalPostings: 345,
        topRoles: [
          { name: 'Software Engineer', count: 178 },
          { name: 'Customer Support', count: 98 },
          { name: 'Design', count: 69 },
        ],
        trend: 'down',
        trendValue: -1.9,
        strengths: [
          'Remote-focused',
        ],
        weaknesses: [
          'Limited traffic',
          'Moderate repost rate',
        ],
        recommendations: [
          'Secondary remote option',
        ],
        scoreBreakdown: {
          lifespan: 14,
          reposts: 12,
          employer: 15,
          candidate: 11,
        },
        dataQuality: 72,
      },
      'dribbble-jobs': {
        name: 'Dribbble Jobs',
        score: 51,
        grade: 'D',
        lifespan: 16,
        repostRate: 10,
        totalPostings: 234,
        topRoles: [
          { name: 'UI Designer', count: 156 },
          { name: 'Product Designer', count: 78 },
        ],
        trend: 'stable',
        trendValue: 0.3,
        strengths: [
          'Design-focused platform',
          'Quality designer audience',
        ],
        weaknesses: [
          'Very niche',
          'Small pool',
        ],
        recommendations: [
          'Design-only platform',
        ],
        scoreBreakdown: {
          lifespan: 19,
          reposts: 12,
          employer: 12,
          candidate: 8,
        },
        dataQuality: 70,
      },
      'idealist.org': {
        name: 'Idealist.org',
        score: 49,
        grade: 'D',
        lifespan: 26,
        repostRate: 19,
        totalPostings: 567,
        topRoles: [
          { name: 'Program Manager', count: 234 },
          { name: 'Development Officer', count: 189 },
          { name: 'Coordinator', count: 144 },
        ],
        trend: 'down',
        trendValue: -2.1,
        strengths: [
          'Nonprofit focus',
          'Mission-driven candidates',
        ],
        weaknesses: [
          'Very niche audience',
          'High repost rate',
          'Declining',
        ],
        recommendations: [
          'Only for nonprofit roles',
        ],
        scoreBreakdown: {
          lifespan: 10,
          reposts: 8,
          employer: 18,
          candidate: 13,
        },
        dataQuality: 65,
      },
      'virtual-vocations': {
        name: 'Virtual Vocations',
        score: 47,
        grade: 'D',
        lifespan: 23,
        repostRate: 15,
        totalPostings: 289,
        topRoles: [
          { name: 'Virtual Assistant', count: 123 },
          { name: 'Transcriber', count: 87 },
          { name: 'Customer Service', count: 79 },
        ],
        trend: 'down',
        trendValue: -0.8,
        strengths: [
          'Remote-focused niche',
        ],
        weaknesses: [
          'Small pool',
          'Limited quality',
          'Declining',
        ],
        recommendations: [
          'Limited usefulness',
        ],
        scoreBreakdown: {
          lifespan: 12,
          reposts: 10,
          employer: 14,
          candidate: 11,
        },
        dataQuality: 61,
      },
      'crunchboard': {
        name: 'Crunchboard',
        score: 45,
        grade: 'F',
        lifespan: 20,
        repostRate: 22,
        totalPostings: 189,
        topRoles: [
          { name: 'Software Engineer', count: 98 },
          { name: 'Marketing', count: 56 },
          { name: 'Sales', count: 35 },
        ],
        trend: 'down',
        trendValue: -3.4,
        strengths: [
          'Tech-focused niche',
        ],
        weaknesses: [
          'Very low traffic',
          'High repost rate',
          'Declining platform',
        ],
        recommendations: [
          'Not recommended',
        ],
        scoreBreakdown: {
          lifespan: 8,
          reposts: 6,
          employer: 18,
          candidate: 13,
        },
        dataQuality: 58,
      },
      'dice': {
        name: 'Dice',
        score: 44,
        grade: 'F',
        lifespan: 25,
        repostRate: 24,
        totalPostings: 1234,
        topRoles: [
          { name: 'Software Engineer', count: 456 },
          { name: 'IT Support', count: 234 },
          { name: 'System Admin', count: 189 },
        ],
        trend: 'down',
        trendValue: -4.2,
        strengths: [
          'Tech talent pool (legacy)',
        ],
        weaknesses: [
          'Declining platform',
          'Very high repost rate',
          'Outdated interface',
          'Lost market share',
        ],
        recommendations: [
          'Legacy platform, avoid',
        ],
        scoreBreakdown: {
          lifespan: 6,
          reposts: 4,
          employer: 18,
          candidate: 16,
        },
        dataQuality: 54,
      },
      'problogger': {
        name: 'ProBlogger',
        score: 42,
        grade: 'F',
        lifespan: 19,
        repostRate: 17,
        totalPostings: 145,
        topRoles: [
          { name: 'Content Writer', count: 89 },
          { name: 'Blogger', count: 56 },
        ],
        trend: 'down',
        trendValue: -1.6,
        strengths: [
          'Writing-focused niche',
        ],
        weaknesses: [
          'Very small pool',
          'Limited usefulness',
          'Declining',
        ],
        recommendations: [
          'Only for writing roles',
        ],
        scoreBreakdown: {
          lifespan: 14,
          reposts: 10,
          employer: 11,
          candidate: 7,
        },
        dataQuality: 51,
      },
      'design-observer': {
        name: 'Design Observer',
        score: 41,
        grade: 'F',
        lifespan: 18,
        repostRate: 12,
        totalPostings: 89,
        topRoles: [
          { name: 'Designer', count: 56 },
          { name: 'Art Director', count: 33 },
        ],
        trend: 'stable',
        trendValue: -0.2,
        strengths: [
          'Design industry connection',
        ],
        weaknesses: [
          'Extremely small pool',
          'Niche audience',
          'Limited reach',
        ],
        recommendations: [
          'Not recommended',
        ],
        scoreBreakdown: {
          lifespan: 13,
          reposts: 9,
          employer: 10,
          candidate: 9,
        },
        dataQuality: 49,
      },
      'blind': {
        name: 'Blind',
        score: 39,
        grade: 'F',
        lifespan: 8,
        repostRate: 4,
        totalPostings: 67,
        topRoles: [
          { name: 'Software Engineer', count: 45 },
          { name: 'Product Manager', count: 22 },
        ],
        trend: 'up',
        trendValue: 1.3,
        strengths: [
          'Anonymous tech community',
          'Insider perspective',
        ],
        weaknesses: [
          'Very small pool',
          'Growing but niche',
          'Limited hiring',
        ],
        recommendations: [
          'Not primary hiring channel',
        ],
        scoreBreakdown: {
          lifespan: 11,
          reposts: 8,
          employer: 12,
          candidate: 8,
        },
        dataQuality: 45,
      },
      'environmentalcareer.com': {
        name: 'EnvironmentalCareer.com',
        score: 37,
        grade: 'F',
        lifespan: 22,
        repostRate: 18,
        totalPostings: 123,
        topRoles: [
          { name: 'Environmental Officer', count: 45 },
          { name: 'Sustainability', count: 34 },
          { name: 'Conservation', count: 44 },
        ],
        trend: 'down',
        trendValue: -0.9,
        strengths: [
          'Niche environmental focus',
        ],
        weaknesses: [
          'Very small pool',
          'Limited traffic',
          'Declining',
        ],
        recommendations: [
          'Only for environmental roles',
        ],
        scoreBreakdown: {
          lifespan: 9,
          reposts: 7,
          employer: 12,
          candidate: 9,
        },
        dataQuality: 43,
      },
      'monster': {
        name: 'Monster',
        score: 35,
        grade: 'F',
        lifespan: 28,
        repostRate: 26,
        totalPostings: 4567,
        topRoles: [
          { name: 'Sales', count: 987 },
          { name: 'Administrative', count: 654 },
          { name: 'Support', count: 534 },
        ],
        trend: 'down',
        trendValue: -5.1,
        strengths: [
          'Large legacy pool',
        ],
        weaknesses: [
          'Declining platform',
          'Poor data quality',
          'Very high repost rate',
          'Spam applicants',
          'Outdated',
        ],
        recommendations: [
          'Legacy platform, avoid',
        ],
        scoreBreakdown: {
          lifespan: 4,
          reposts: 2,
          employer: 18,
          candidate: 11,
        },
        dataQuality: 38,
      },
      'mediabistro': {
        name: 'Mediabistro',
        score: 32,
        grade: 'F',
        lifespan: 24,
        repostRate: 20,
        totalPostings: 156,
        topRoles: [
          { name: 'Journalist', count: 67 },
          { name: 'Content Creator', count: 56 },
          { name: 'Editor', count: 33 },
        ],
        trend: 'down',
        trendValue: -2.3,
        strengths: [
          'Media industry niche',
        ],
        weaknesses: [
          'Small declining pool',
          'Limited traffic',
          'Niche only',
        ],
        recommendations: [
          'Only for media roles',
        ],
        scoreBreakdown: {
          lifespan: 8,
          reposts: 6,
          employer: 10,
          candidate: 8,
        },
        dataQuality: 40,
      },
      'built-in': {
        name: 'Built In',
        score: 67,
        grade: 'B',
        lifespan: 16,
        repostRate: 7,
        totalPostings: 1200,
        topRoles: [
          { name: 'Software Engineer', count: 876 },
          { name: 'Product Manager', count: 198 },
          { name: 'Designer', count: 126 },
        ],
        trend: 'up',
        trendValue: 2.5,
        strengths: ['Tech startup content', 'Growing platform', 'Quality posts'],
        weaknesses: ['Smaller pool', 'Limited non-tech roles'],
        recommendations: ['Good for tech startups', 'Combine with general boards'],
        scoreBreakdown: { lifespan: 30, reposts: 26, employer: 17, candidate: -6 },
        dataQuality: 85,
      },
      'remote-tech-jobs': {
        name: 'Remote Tech Jobs',
        score: 65,
        grade: 'B-',
        lifespan: 17,
        repostRate: 8,
        totalPostings: 567,
        topRoles: [
          { name: 'Software Engineer', count: 456 },
          { name: 'DevOps Engineer', count: 89 },
          { name: 'Full Stack Developer', count: 22 },
        ],
        trend: 'up',
        trendValue: 3.2,
        strengths: ['Remote-focused tech', 'Growing community', 'Quality candidates'],
        weaknesses: ['Smaller pool than competitors', 'Limited visibility'],
        recommendations: ['Use for remote tech roles', 'Secondary remote channel'],
        scoreBreakdown: { lifespan: 28, reposts: 25, employer: 16, candidate: -4 },
        dataQuality: 80,
      },
      'wellfound': {
        name: 'WellFound',
        score: 53,
        grade: 'C',
        lifespan: 14,
        repostRate: 6,
        totalPostings: 456,
        topRoles: [
          { name: 'Software Engineer', count: 234 },
          { name: 'Product Manager', count: 156 },
          { name: 'Designer', count: 66 },
        ],
        trend: 'up',
        trendValue: 1.8,
        strengths: ['Startup ecosystem', 'Founder network', 'Growing platform'],
        weaknesses: ['Smaller pool', 'Startup-only focus', 'More niche'],
        recommendations: ['Best for startups', 'Good founder network'],
        scoreBreakdown: { lifespan: 25, reposts: 20, employer: 14, candidate: -6 },
        dataQuality: 79,
      },
      'data-jobs': {
        name: 'Data Jobs',
        score: 43,
        grade: 'F',
        lifespan: 21,
        repostRate: 16,
        totalPostings: 234,
        topRoles: [
          { name: 'Data Scientist', count: 156 },
          { name: 'Data Engineer', count: 78 },
        ],
        trend: 'stable',
        trendValue: -0.4,
        strengths: ['Data role specialization', 'Niche community'],
        weaknesses: ['Very small pool', 'Limited visibility', 'Low data quality'],
        recommendations: ['Only for data roles', 'Limited mainstream use'],
        scoreBreakdown: { lifespan: 17, reposts: 13, employer: 12, candidate: 1 },
        dataQuality: 52,
      },
      'geekwork': {
        name: 'Geekwork',
        score: 39,
        grade: 'F',
        lifespan: 19,
        repostRate: 14,
        totalPostings: 123,
        topRoles: [
          { name: 'Software Engineer', count: 89 },
          { name: 'IT Support', count: 34 },
        ],
        trend: 'down',
        trendValue: -1.2,
        strengths: ['Tech community', 'Professional network'],
        weaknesses: ['Very small pool', 'Declining traffic', 'High repost rate'],
        recommendations: ['Not recommended', 'Use as last resort'],
        scoreBreakdown: { lifespan: 13, reposts: 10, employer: 11, candidate: 5 },
        dataQuality: 48,
      },
      'icrunchdata': {
        name: 'iCrunchData',
        score: 38,
        grade: 'F',
        lifespan: 20,
        repostRate: 15,
        totalPostings: 89,
        topRoles: [
          { name: 'Data Scientist', count: 56 },
          { name: 'Machine Learning Engineer', count: 33 },
        ],
        trend: 'down',
        trendValue: -0.8,
        strengths: ['Data science focus', 'Niche community'],
        weaknesses: ['Very small pool', 'Limited traffic', 'Poor data quality'],
        recommendations: ['Not recommended', 'Extremely niche'],
        scoreBreakdown: { lifespan: 12, reposts: 9, employer: 10, candidate: 7 },
        dataQuality: 46,
      },
      'reddit-sysadminjobs': {
        name: 'Reddit /r/sysadminjobs',
        score: 29,
        grade: 'F',
        lifespan: 25,
        repostRate: 28,
        totalPostings: 78,
        topRoles: [
          { name: 'System Administrator', count: 56 },
          { name: 'Infrastructure Engineer', count: 22 },
        ],
        trend: 'down',
        trendValue: -1.5,
        strengths: ['Community-based', 'Free posting', 'Tech community'],
        weaknesses: ['Very low quality', 'High spam', 'No verification', 'Declining'],
        recommendations: ['Not recommended', 'Very poor data quality'],
        scoreBreakdown: { lifespan: 8, reposts: 5, employer: 8, candidate: 8 },
        dataQuality: 35,
      },
      'craigslist': {
        name: 'CraigsList',
        score: 28,
        grade: 'F',
        lifespan: 30,
        repostRate: 35,
        totalPostings: 5234,
        topRoles: [
          { name: 'General Labor', count: 1234 },
          { name: 'Services', count: 876 },
          { name: 'Support', count: 654 },
        ],
        trend: 'down',
        trendValue: -6.8,
        strengths: [
          'Large general pool',
        ],
        weaknesses: [
          'Lowest quality data',
          'Extreme repost rate (35%)',
          'Spam and fraud',
          'No verification',
          'Outdated platform',
        ],
        recommendations: [
          'Not recommended for serious hiring',
        ],
        scoreBreakdown: {
          lifespan: 2,
          reposts: 1,
          employer: 18,
          candidate: 7,
        },
        dataQuality: 32,
      },
      'microsoft': {
        name: 'Microsoft',
        score: 27,
        grade: 'F',
        lifespan: 35,
        repostRate: 22,
        totalPostings: 25000,
        topRoles: [
          { name: 'Software Engineer', count: 8900 },
          { name: 'Product Manager', count: 2100 },
          { name: 'Cloud Solutions Architect', count: 1800 },
        ],
        trend: 'stable',
        trendValue: 0.2,
        strengths: [
          'Direct from company',
          'High-quality positions',
          'Competitive compensation',
          'Large volume of opportunities',
          'Strong company reputation',
        ],
        weaknesses: [
          'Limited to Microsoft roles',
          'Extremely competitive',
          'Geographic limitations',
          'High qualifications required',
          'Single company focus',
        ],
        recommendations: [
          'Great if interested in Microsoft specifically',
          'Not for diverse opportunities',
          'Best combined with other boards',
        ],
        scoreBreakdown: {
          lifespan: 12,
          reposts: 15,
          employer: 22,
          candidate: 18,
        },
        dataQuality: 88,
      },
    }

  const [profile, setProfile] = useState<BoardProfile>(() => {
    // Initialize with default (Stack Overflow) immediately
    return mockProfiles['stack-overflow']
  })

  // Update profile when boardParam changes
  useEffect(() => {
    if (!boardParam) return
    const normalizedBoard = (boardParam as string)
      .toLowerCase()
      .replace(/\s+/g, '-')
    const foundProfile = mockProfiles[normalizedBoard] || mockProfiles['stack-overflow']
    setProfile(foundProfile)
  }, [boardParam])

  const gradeColor =
    profile.grade.startsWith('A')
      ? 'text-green-400'
      : profile.grade.startsWith('B')
      ? 'text-blue-400'
      : profile.grade.startsWith('C')
      ? 'text-yellow-400'
      : 'text-red-400'

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    return 'bg-red-500'
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={profile.name}
        description="Detailed board analysis and performance metrics"
      />

      {/* Overview Cards */}
      <StatsSection>
        <MetricCard
          label="Efficiency Score"
          value={profile.score}
          subtitle={`Grade: ${profile.grade}`}
          icon="⭐"
        />
        <MetricCard
          label="Avg Lifespan"
          value={`${profile.lifespan}d`}
          subtitle="Days to fill"
          icon="⏱️"
        />
        <MetricCard
          label="Data Quality"
          value={`${profile.dataQuality}%`}
          subtitle="Duplicate-free"
          icon="✅"
        />
        <MetricCard
          label="Total Jobs"
          value={profile.totalPostings}
          subtitle="In database"
          trend={profile.trend}
          trendValue={`${profile.trendValue > 0 ? '+' : ''}${profile.trendValue}%`}
          icon="📝"
        />
      </StatsSection>

      {/* Score Breakdown */}
      <Section title="Efficiency Score Breakdown (Out of 100)">
        <Card>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Lifespan Component (40%)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    How fast jobs get filled
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.lifespan} / 40 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(profile.scoreBreakdown.lifespan / 40) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Repost Quality (30%)</span>
                  <p className="text-xs text-gray-500 mt-1">Data cleanliness</p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.reposts} / 30 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(profile.scoreBreakdown.reposts / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">Employer Feedback (20%)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Hiring satisfaction ratings
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.employer} / 20 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={
                    { width: `${(profile.scoreBreakdown.employer / 20) * 100}%` }
                  }
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-gray-400">
                    Candidate Visibility (10%)
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Job seeker engagement
                  </p>
                </div>
                <span className="text-white font-semibold">
                  {profile.scoreBreakdown.candidate} / 10 pts
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-600 h-3 rounded-full"
                  style={
                    { width: `${(profile.scoreBreakdown.candidate / 10) * 100}%` }
                  }
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* Performance and Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Performance Metrics */}
        <Section title="Performance Metrics">
          <Card>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Hiring Speed</span>
                  <span className="text-white">{profile.lifespan} days</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.max(100 - profile.lifespan * 3, 20)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Data Quality</span>
                  <span className="text-white">{profile.dataQuality}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${profile.dataQuality}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Overall Score</span>
                  <span className="text-white">{profile.score}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${scoreColor(profile.score)}`}
                    style={{ width: `${profile.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {profile.trend === 'up' ? '📈' : profile.trend === 'down' ? '📉' : '→'}
                  </span>
                  <div>
                    <p className="text-white font-semibold">
                      {profile.trend === 'up'
                        ? 'Improving'
                        : profile.trend === 'down'
                        ? 'Declining'
                        : 'Stable'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {profile.trendValue > 0 ? '+' : ''}
                      {profile.trendValue}% over 30 days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* Top Roles */}
        <Section title="Top Roles">
          <Card>
            <div className="space-y-3">
              {profile.topRoles.map((role, idx) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-semibold">#{idx + 1}</span>
                    <span className="text-white">{role.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-300 text-sm font-medium">
                      {role.count} jobs
                    </span>
                    <div className="w-24 bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            (role.count /
                              profile.topRoles[0].count) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Section title="✅ Strengths">
          <Card>
            <ul className="space-y-2">
              {profile.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>

        <Section title="⚠️ Weaknesses">
          <Card>
            <ul className="space-y-2">
              {profile.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✕</span>
                  <span className="text-gray-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>

      {/* Strategic Recommendations */}
      <Section title="💡 Strategic Recommendations">
        <div className="space-y-3">
          {profile.recommendations.map((rec, idx) => (
            <Card key={idx}>
              <div className="flex gap-3">
                <span className="text-yellow-400 text-xl">💡</span>
                <p className="text-gray-300">{rec}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Comparison Link */}
      <Section title="Compare with Other Boards">
        <Card>
          <p className="text-gray-400 mb-4">
            Want to see how {profile.name} stacks up against other job boards?
          </p>
          <a
            href="/dashboard/comparison"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Comparison Table →
          </a>
        </Card>
      </Section>
    </DashboardLayout>
  )
}
