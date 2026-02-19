/**
 * Role Family Definitions and Mappings
 * Maps job titles to standardized role families for analytics
 */

export type RoleFamily =
  | 'software-engineer'
  | 'data-scientist'
  | 'product-manager'
  | 'designer'
  | 'devops-infrastructure'
  | 'qa-testing'
  | 'business-analyst'
  | 'sales'
  | 'marketing'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'executive'
  | 'other'

export interface RoleFamilyDef {
  family: RoleFamily
  keywords: string[]
  excludeKeywords?: string[]
  aliases: string[]
}

// Comprehensive role family database
const ROLE_FAMILIES: RoleFamilyDef[] = [
  {
    family: 'software-engineer',
    keywords: [
      'software engineer',
      'developer',
      'programmer',
      'backend',
      'frontend',
      'full stack',
      'fullstack',
      'code',
      'coding',
      'python',
      'javascript',
      'java',
      'c++',
      'golang',
      'rust',
      'typescript',
      'node',
      'react',
      'angular',
      'vue',
      'spring',
      'rails',
      'django',
      'senior software engineer',
      'junior developer',
      'lead engineer',
      'principal engineer',
      'software architect',
      'systems engineer',
    ],
    excludeKeywords: [
      'qa',
      'test',
      'quality assurance',
      'manager',
      'product manager',
      'technical writer',
    ],
    aliases: [
      'SWE',
      'Dev',
      'Programmer',
      'Coder',
      'Backend Engineer',
      'Frontend Engineer',
      'Full Stack Engineer',
    ],
  },
  {
    family: 'data-scientist',
    keywords: [
      'data scientist',
      'machine learning',
      'ml engineer',
      'ai engineer',
      'artificial intelligence',
      'deep learning',
      'nlp',
      'computer vision',
      'analytics',
      'data analyst',
      'big data',
      'spark',
      'hadoop',
      'tensorflow',
      'pytorch',
      'scikit',
      'python data',
      'r programmer',
      'statistical',
      'predictive model',
    ],
    excludeKeywords: ['sales analyst', 'business analyst'],
    aliases: ['Data Scientist', 'ML Engineer', 'AI Specialist'],
  },
  {
    family: 'product-manager',
    keywords: [
      'product manager',
      'product management',
      'pm',
      'senior product manager',
      'principal product manager',
      'associate product manager',
      'apm',
      'product owner',
      'product lead',
      'product strategy',
    ],
    excludeKeywords: [],
    aliases: ['PM', 'Product Lead', 'Product Owner'],
  },
  {
    family: 'designer',
    keywords: [
      'designer',
      'ux designer',
      'ui designer',
      'ux/ui',
      'interaction designer',
      'product designer',
      'design system',
      'graphic designer',
      'creative',
      'visual design',
      'motion designer',
      'design lead',
      'design director',
      'design manager',
    ],
    excludeKeywords: ['software', 'engineer'],
    aliases: ['UX Designer', 'UI Designer', 'Product Designer'],
  },
  {
    family: 'devops-infrastructure',
    keywords: [
      'devops',
      'infrastructure',
      'sre',
      'site reliability',
      'cloud engineer',
      'aws',
      'azure',
      'gcp',
      'kubernetes',
      'docker',
      'terraform',
      'ansible',
      'cloud architecture',
      'platform engineer',
      'systems administrator',
      'network engineer',
    ],
    excludeKeywords: [],
    aliases: ['DevOps Engineer', 'Infrastructure Engineer', 'SRE'],
  },
  {
    family: 'qa-testing',
    keywords: [
      'qa',
      'quality assurance',
      'test engineer',
      'tester',
      'automation',
      'selenium',
      'cypress',
      'test automation',
      'qa automation',
      'qa engineer',
      'quality engineer',
      'cypress',
      'manual testing',
      'test lead',
    ],
    excludeKeywords: [],
    aliases: ['QA Engineer', 'Test Automation Engineer', 'QA Tester'],
  },
  {
    family: 'business-analyst',
    keywords: [
      'business analyst',
      'business analysis',
      'ba',
      'requirement',
      'requirements analyst',
      'solutions analyst',
      'systems analyst',
    ],
    excludeKeywords: ['data analyst', 'sales analyst'],
    aliases: ['Business Analyst', 'BA', 'Solutions Analyst'],
  },
  {
    family: 'sales',
    keywords: [
      'sales',
      'account executive',
      'account manager',
      'sales engineer',
      'sales director',
      'sales manager',
      'business development',
      'enterprise sales',
      'saas sales',
    ],
    excludeKeywords: ['inside sales'],
    aliases: ['Sales Rep', 'Account Executive', 'Business Development'],
  },
  {
    family: 'marketing',
    keywords: [
      'marketing',
      'product marketing',
      'growth',
      'content marketing',
      'marketing manager',
      'marketing director',
      'digital marketing',
      'seo',
      'sem',
      'marketing analyst',
    ],
    excludeKeywords: [],
    aliases: ['Marketing Manager', 'Growth Manager', 'Content Writer'],
  },
  {
    family: 'operations',
    keywords: [
      'operations',
      'ops',
      'operations manager',
      'operations director',
      'recruiting',
      'recruiter',
      'talent acquisition',
      'talent',
      'supply chain',
    ],
    excludeKeywords: [],
    aliases: ['Operations Manager', 'Recruiter', 'Talent Acquisition'],
  },
  {
    family: 'finance',
    keywords: [
      'finance',
      'accountant',
      'accounting',
      'financial analyst',
      'cpa',
      'controller',
      'cfo',
      'treasurer',
    ],
    excludeKeywords: [],
    aliases: ['Accountant', 'Financial Analyst', 'Finance Manager'],
  },
  {
    family: 'hr',
    keywords: [
      'human resources',
      'hr',
      'hr manager',
      'people operations',
      'culture',
      'people',
      'compensation',
      'benefits',
    ],
    excludeKeywords: [],
    aliases: ['HR Manager', 'People Operations', 'Recruiter'],
  },
  {
    family: 'executive',
    keywords: [
      'ceo',
      'coo',
      'cto',
      'vp',
      'vice president',
      'president',
      'founder',
      'executive',
      'c-level',
    ],
    excludeKeywords: [],
    aliases: ['CEO', 'CTO', 'VP', 'Executive'],
  },
]

/**
 * Normalize a job title to a role family
 */
export function normalizeJobTitle(title: string): RoleFamily {
  const lowerTitle = title.toLowerCase().trim()

  // Check each role family
  for (const role of ROLE_FAMILIES) {
    // Check if any keyword matches
    const keywordMatch = role.keywords.some((keyword) =>
      lowerTitle.includes(keyword.toLowerCase())
    )

    if (!keywordMatch) continue

    // Check if excluded keywords are present
    if (role.excludeKeywords) {
      const excludedMatch = role.excludeKeywords.some((keyword) =>
        lowerTitle.includes(keyword.toLowerCase())
      )
      if (excludedMatch) continue
    }

    return role.family
  }

  // Default to 'other' if no match found
  return 'other'
}

/**
 * Get all role families
 */
export function getRoleFamilies(): RoleFamilyDef[] {
  return ROLE_FAMILIES
}

/**
 * Get a specific role family definition
 */
export function getRoleFamily(family: RoleFamily): RoleFamilyDef | undefined {
  return ROLE_FAMILIES.find((r) => r.family === family)
}

/**
 * Get keywords for a role family
 */
export function getRoleFamilyKeywords(family: RoleFamily): string[] {
  const role = getRoleFamily(family)
  return role?.keywords || []
}

/**
 * Normalize multiple titles
 */
export function normalizeTitles(titles: string[]): Record<string, RoleFamily> {
  return titles.reduce(
    (acc, title) => {
      acc[title] = normalizeJobTitle(title)
      return acc
    },
    {} as Record<string, RoleFamily>
  )
}

/**
 * Get similarity score between two titles (0-1)
 */
export function getTitleSimilarity(title1: string, title2: string): number {
  const family1 = normalizeJobTitle(title1)
  const family2 = normalizeJobTitle(title2)

  if (family1 === family2 && family1 !== 'other') {
    return 0.9 // Same family = high similarity
  }

  // Calculate string similarity using Levenshtein distance
  const distance = levenshteinDistance(
    title1.toLowerCase(),
    title2.toLowerCase()
  )
  const maxLength = Math.max(title1.length, title2.length)
  return 1 - distance / maxLength
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length
  const len2 = s2.length
  const matrix: number[][] = []

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return matrix[len2][len1]
}

/**
 * Group titles by role family
 */
export function groupTitlesByFamily(
  titles: string[]
): Record<RoleFamily, string[]> {
  const grouped: Record<RoleFamily, string[]> = {
    'software-engineer': [],
    'data-scientist': [],
    'product-manager': [],
    designer: [],
    'devops-infrastructure': [],
    'qa-testing': [],
    'business-analyst': [],
    sales: [],
    marketing: [],
    operations: [],
    finance: [],
    hr: [],
    executive: [],
    other: [],
  }

  titles.forEach((title) => {
    const family = normalizeJobTitle(title)
    grouped[family].push(title)
  })

  return grouped
}

/**
 * Get statistics about role family distribution
 */
export function getRoleFamilyStats(titles: string[]): Record<RoleFamily, number> {
  const grouped = groupTitlesByFamily(titles)
  const stats: Record<RoleFamily, number> = {} as Record<RoleFamily, number>

  Object.entries(grouped).forEach(([family, titles]) => {
    stats[family as RoleFamily] = titles.length
  })

  return stats
}
