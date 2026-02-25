// Fallback board data for all pages - 70 comprehensive job boards across all industries
export interface BoardData {
  id: number
  name: string
  url: string
  industry: string
  score: number
  grade: string
  avgLifespan: number
  repostRate: number
  totalPostings: number
  topRole: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  dataQuality: number
  affiliateUrl: string
  roles: string[]
}

export const FALLBACK_BOARDS: BoardData[] = [
  // Technology (15 boards)
  { id: 1, name: 'LinkedIn', url: 'https://linkedin.com/jobs', industry: 'Technology', score: 85, grade: 'A', avgLifespan: 14, repostRate: 8.5, totalPostings: 8456, topRole: 'Software Engineer', trend: 'up', trendValue: 2.5, dataQuality: 90, affiliateUrl: 'https://linkedin.com/jobs', roles: ['Software Engineer', 'Front-End Engineer', 'Full-Stack Engineer', 'Product Manager', 'Data Scientist'] },
  { id: 2, name: 'Stack Overflow Jobs', url: 'https://stackoverflow.com/jobs', industry: 'Technology', score: 88, grade: 'A', avgLifespan: 12, repostRate: 6.5, totalPostings: 3400, topRole: 'Software Engineer', trend: 'up', trendValue: 3.2, dataQuality: 92, affiliateUrl: 'https://stackoverflow.com/jobs', roles: ['Software Engineer', 'Front-End Engineer', 'Full-Stack Engineer', 'Developer'] },
  { id: 3, name: 'GitHub Jobs', url: 'https://jobs.github.com', industry: 'Technology', score: 84, grade: 'A', avgLifespan: 13, repostRate: 7.2, totalPostings: 2800, topRole: 'Developer', trend: 'up', trendValue: 2.8, dataQuality: 91, affiliateUrl: 'https://jobs.github.com', roles: ['Developer', 'Software Engineer', 'Full-Stack Engineer', 'Front-End Engineer'] },
  { id: 4, name: 'AngelList Talent', url: 'https://angel.co/jobs', industry: 'Technology', score: 81, grade: 'B', avgLifespan: 14, repostRate: 8.1, totalPostings: 1800, topRole: 'Developer', trend: 'up', trendValue: 1.9, dataQuality: 87, affiliateUrl: 'https://angel.co/jobs', roles: ['Developer', 'Software Engineer', 'Product Manager', 'Designer', 'Data Scientist'] },
  { id: 5, name: 'Hired', url: 'https://hired.com', industry: 'Technology', score: 83, grade: 'A', avgLifespan: 11, repostRate: 6.2, totalPostings: 1500, topRole: 'Software Engineer', trend: 'up', trendValue: 2.1, dataQuality: 89, affiliateUrl: 'https://hired.com', roles: ['Software Engineer', 'Full-Stack Engineer', 'Data Scientist', 'DevOps', 'Product Manager'] },
  { id: 6, name: 'Built In', url: 'https://builtin.com', industry: 'Technology', score: 82, grade: 'A', avgLifespan: 13, repostRate: 7.3, totalPostings: 2200, topRole: 'Software Engineer', trend: 'up', trendValue: 2.4, dataQuality: 88, affiliateUrl: 'https://builtin.com', roles: ['Software Engineer', 'Data Science', 'Product Management', 'UX/UI', 'DevOps'] },
  { id: 7, name: 'Dice', url: 'https://dice.com', industry: 'Technology', score: 79, grade: 'B', avgLifespan: 15, repostRate: 9.2, totalPostings: 2600, topRole: 'Software Engineer', trend: 'stable', trendValue: 0.4, dataQuality: 85, affiliateUrl: 'https://dice.com', roles: ['Software Engineer', 'Data Science', 'Cybersecurity', 'Cloud Engineering'] },
  { id: 8, name: 'We Work Remotely', url: 'https://weworkremotely.com', industry: 'Technology', score: 80, grade: 'B', avgLifespan: 16, repostRate: 8.9, totalPostings: 1500, topRole: 'Developer', trend: 'stable', trendValue: 0.2, dataQuality: 86, affiliateUrl: 'https://weworkremotely.com', roles: ['Developer', 'Designer', 'Full-Stack Engineer', 'Front-End Engineer', 'Product Manager'] },
  { id: 9, name: 'Dribbble Jobs', url: 'https://dribbble.com/jobs', industry: 'Technology', score: 76, grade: 'C', avgLifespan: 18, repostRate: 11.2, totalPostings: 900, topRole: 'Designer', trend: 'stable', trendValue: 0.5, dataQuality: 82, affiliateUrl: 'https://dribbble.com/jobs', roles: ['Designer', 'Front-End Engineer', 'Developer'] },
  { id: 10, name: 'CrunchBoard', url: 'https://jobs.techcrunch.com', industry: 'Technology', score: 78, grade: 'B', avgLifespan: 16, repostRate: 9.5, totalPostings: 1200, topRole: 'Software Engineer', trend: 'up', trendValue: 1.8, dataQuality: 84, affiliateUrl: 'https://jobs.techcrunch.com', roles: ['Software Engineer', 'Product', 'Design', 'Engineering'] },
  { id: 11, name: 'TechFetch', url: 'https://techfetch.com', industry: 'Technology', score: 75, grade: 'C', avgLifespan: 17, repostRate: 10.1, totalPostings: 1400, topRole: 'Software Engineer', trend: 'stable', trendValue: 0.3, dataQuality: 81, affiliateUrl: 'https://techfetch.com', roles: ['Software Engineer', 'Systems Engineering', 'IT Consulting'] },
  { id: 12, name: 'Remote Tech Jobs', url: 'https://remotetechjobs.com', industry: 'Technology', score: 81, grade: 'B', avgLifespan: 12, repostRate: 7.8, totalPostings: 1100, topRole: 'Developer', trend: 'up', trendValue: 2.2, dataQuality: 87, affiliateUrl: 'https://remotetechjobs.com', roles: ['Developer', 'DevOps', 'Cloud Engineer', 'Data Science'] },
  { id: 13, name: 'Upwork', url: 'https://upwork.com', industry: 'Technology', score: 73, grade: 'C', avgLifespan: 20, repostRate: 12.5, totalPostings: 5000, topRole: 'Developer', trend: 'stable', trendValue: 0.0, dataQuality: 79, affiliateUrl: 'https://upwork.com', roles: ['Developer', 'Web Development', 'Data Science', 'QA'] },
  { id: 14, name: 'Sentry Jobs', url: 'https://workboard.sentry.io/jobs', industry: 'Technology', score: 77, grade: 'C', avgLifespan: 14, repostRate: 8.7, totalPostings: 800, topRole: 'DevOps', trend: 'stable', trendValue: 0.1, dataQuality: 83, affiliateUrl: 'https://workboard.sentry.io/jobs', roles: ['Cloud Engineer', 'DevOps', 'Backend Engineer'] },
  { id: 15, name: 'Crunchboard', url: 'https://crunchboard.com', industry: 'Technology', score: 76, grade: 'C', avgLifespan: 17, repostRate: 9.8, totalPostings: 1050, topRole: 'Software Engineer', trend: 'stable', trendValue: 0.2, dataQuality: 80, affiliateUrl: 'https://crunchboard.com', roles: ['Software Engineer', 'Startup Tech'] },

  // General (12 boards)
  { id: 16, name: 'Indeed', url: 'https://indeed.com', industry: 'General', score: 78, grade: 'B', avgLifespan: 16, repostRate: 10.2, totalPostings: 7200, topRole: 'Manager', trend: 'stable', trendValue: 0.5, dataQuality: 85, affiliateUrl: 'https://indeed.com', roles: ['Developer', 'Product Manager', 'Designer', 'Manager', 'Sales'] },
  { id: 17, name: 'Glassdoor', url: 'https://glassdoor.com/Job', industry: 'General', score: 75, grade: 'C', avgLifespan: 20, repostRate: 12.3, totalPostings: 5600, topRole: 'Manager', trend: 'down', trendValue: -1.8, dataQuality: 80, affiliateUrl: 'https://glassdoor.com/Job', roles: ['Manager', 'Operations', 'HR Manager', 'Product Manager', 'Administrative'] },
  { id: 18, name: 'CareerBuilder', url: 'https://careerbuilder.com', industry: 'General', score: 72, grade: 'C', avgLifespan: 22, repostRate: 13.5, totalPostings: 4200, topRole: 'Administrative', trend: 'down', trendValue: -2.1, dataQuality: 78, affiliateUrl: 'https://careerbuilder.com', roles: ['Administrative', 'Manager', 'Sales', 'Operations', 'Marketing'] },
  { id: 19, name: 'ZipRecruiter', url: 'https://ziprecruiter.com', industry: 'General', score: 70, grade: 'D', avgLifespan: 24, repostRate: 15.0, totalPostings: 3800, topRole: 'Sales', trend: 'down', trendValue: -2.5, dataQuality: 75, affiliateUrl: 'https://ziprecruiter.com', roles: ['Sales', 'Manager', 'Marketing', 'Administrative'] },
  { id: 20, name: 'Monster', url: 'https://monster.com', industry: 'General', score: 68, grade: 'D', avgLifespan: 26, repostRate: 16.2, totalPostings: 2900, topRole: 'Manager', trend: 'down', trendValue: -3.0, dataQuality: 72, affiliateUrl: 'https://monster.com', roles: ['Manager', 'Administrative', 'Operations', 'Sales'] },
  { id: 21, name: 'Snagajob', url: 'https://snagajob.com', industry: 'General', score: 67, grade: 'D', avgLifespan: 25, repostRate: 16.8, totalPostings: 2100, topRole: 'Sales', trend: 'down', trendValue: -2.8, dataQuality: 70, affiliateUrl: 'https://snagajob.com', roles: ['Sales', 'Retail', 'Administrative', 'Operations'] },
  { id: 22, name: 'Craigslist', url: 'https://craigslist.org/search/jjj', industry: 'General', score: 62, grade: 'D', avgLifespan: 30, repostRate: 20.5, totalPostings: 4500, topRole: 'Administrative', trend: 'down', trendValue: -4.2, dataQuality: 65, affiliateUrl: 'https://craigslist.org/search/jjj', roles: ['Administrative', 'Sales', 'Operations'] },
  { id: 23, name: 'The Muse', url: 'https://themuse.com/jobs', industry: 'General', score: 74, grade: 'C', avgLifespan: 19, repostRate: 11.3, totalPostings: 1800, topRole: 'Manager', trend: 'stable', trendValue: 0.2, dataQuality: 81, affiliateUrl: 'https://themuse.com/jobs', roles: ['Manager', 'Product Manager', 'Designer', 'Marketing'] },
  { id: 24, name: 'LinkedIn Jobs', url: 'https://linkedin.com/jobs', industry: 'General', score: 82, grade: 'A', avgLifespan: 15, repostRate: 8.8, totalPostings: 6800, topRole: 'Manager', trend: 'up', trendValue: 1.5, dataQuality: 89, affiliateUrl: 'https://linkedin.com/jobs', roles: ['Manager', 'Product Manager', 'Marketing', 'Operations', 'Sales'] },
  { id: 25, name: 'GovernmentJobs.com', url: 'https://governmentjobs.com', industry: 'General', score: 69, grade: 'D', avgLifespan: 28, repostRate: 13.2, totalPostings: 1600, topRole: 'Administrative', trend: 'stable', trendValue: 0.0, dataQuality: 74, affiliateUrl: 'https://governmentjobs.com', roles: ['Administrative', 'Operations', 'Manager'] },
  { id: 26, name: 'Simplyhired', url: 'https://simplyhired.com', industry: 'General', score: 71, grade: 'C', avgLifespan: 23, repostRate: 14.1, totalPostings: 3200, topRole: 'Manager', trend: 'down', trendValue: -1.5, dataQuality: 76, affiliateUrl: 'https://simplyhired.com', roles: ['Manager', 'Sales', 'Administrative', 'Operations'] },
  { id: 27, name: 'Job.com', url: 'https://job.com', industry: 'General', score: 68, grade: 'D', avgLifespan: 27, repostRate: 15.6, totalPostings: 2800, topRole: 'Administrative', trend: 'down', trendValue: -2.2, dataQuality: 72, affiliateUrl: 'https://job.com', roles: ['Administrative', 'Manager', 'Sales'] },

  // Remote (8 boards)
  { id: 28, name: 'FlexJobs', url: 'https://flexjobs.com', industry: 'Remote', score: 82, grade: 'A', avgLifespan: 18, repostRate: 7.8, totalPostings: 2100, topRole: 'Full-Stack Engineer', trend: 'up', trendValue: 2.1, dataQuality: 88, affiliateUrl: 'https://flexjobs.com', roles: ['Full-Stack Engineer', 'Front-End Engineer', 'Developer', 'Designer', 'Product Manager'] },
  { id: 29, name: 'Remote.co', url: 'https://remote.co/remote-jobs', industry: 'Remote', score: 80, grade: 'B', avgLifespan: 17, repostRate: 8.5, totalPostings: 1400, topRole: 'Developer', trend: 'up', trendValue: 1.8, dataQuality: 85, affiliateUrl: 'https://remote.co/remote-jobs', roles: ['Developer', 'Designer', 'Product Manager', 'Marketing', 'Sales'] },
  { id: 30, name: 'Working Nomads', url: 'https://workingnomads.co', industry: 'Remote', score: 77, grade: 'C', avgLifespan: 19, repostRate: 9.3, totalPostings: 1100, topRole: 'Designer', trend: 'stable', trendValue: 0.3, dataQuality: 83, affiliateUrl: 'https://workingnomads.co', roles: ['Designer', 'Developer', 'Marketing', 'Sales'] },
  { id: 31, name: 'RemoteOK', url: 'https://remoteok.com', industry: 'Remote', score: 79, grade: 'B', avgLifespan: 18, repostRate: 8.9, totalPostings: 1800, topRole: 'Developer', trend: 'up', trendValue: 1.6, dataQuality: 84, affiliateUrl: 'https://remoteok.com', roles: ['Developer', 'Designer', 'Product Manager', 'Marketing'] },
  { id: 32, name: 'Remotive', url: 'https://remotive.io', industry: 'Remote', score: 78, grade: 'B', avgLifespan: 17, repostRate: 9.1, totalPostings: 1250, topRole: 'Developer', trend: 'stable', trendValue: 0.1, dataQuality: 82, affiliateUrl: 'https://remotive.io', roles: ['Developer', 'Designer', 'Marketing', 'Sales'] },
  { id: 33, name: 'Teleport', url: 'https://teleport.org/remotely', industry: 'Remote', score: 75, grade: 'C', avgLifespan: 20, repostRate: 10.2, totalPostings: 950, topRole: 'Developer', trend: 'stable', trendValue: 0.0, dataQuality: 80, affiliateUrl: 'https://teleport.org/remotely', roles: ['Developer', 'Designer', 'Product Manager'] },
  { id: 34, name: 'Virtual Vocations', url: 'https://virtualvocations.com', industry: 'Remote', score: 76, grade: 'C', avgLifespan: 19, repostRate: 9.8, totalPostings: 1300, topRole: 'Developer', trend: 'stable', trendValue: 0.2, dataQuality: 81, affiliateUrl: 'https://virtualvocations.com', roles: ['Developer', 'Marketing', 'Administrative', 'Sales'] },
  { id: 35, name: 'Jobalign', url: 'https://jobalign.com', industry: 'Remote', score: 72, grade: 'C', avgLifespan: 22, repostRate: 11.5, totalPostings: 800, topRole: 'Developer', trend: 'stable', trendValue: -0.2, dataQuality: 77, affiliateUrl: 'https://jobalign.com', roles: ['Developer', 'Designer', 'Administrative'] },

  // Creative & Media (6 boards)
  { id: 36, name: 'Behance Job Board', url: 'https://behance.net/joblist', industry: 'Creative & Media', score: 79, grade: 'B', avgLifespan: 15, repostRate: 9.4, totalPostings: 1200, topRole: 'Designer', trend: 'stable', trendValue: 0.8, dataQuality: 84, affiliateUrl: 'https://behance.net/joblist', roles: ['Designer', 'Developer', 'Marketing'] },
  { id: 37, name: 'Mediabistro', url: 'https://mediabistro.com', industry: 'Creative & Media', score: 74, grade: 'C', avgLifespan: 18, repostRate: 10.8, totalPostings: 950, topRole: 'Designer', trend: 'stable', trendValue: 0.0, dataQuality: 79, affiliateUrl: 'https://mediabistro.com', roles: ['Designer', 'Marketing', 'Administrative'] },
  { id: 38, name: 'ProBlogger', url: 'https://problogger.com', industry: 'Creative & Media', score: 71, grade: 'C', avgLifespan: 21, repostRate: 11.9, totalPostings: 800, topRole: 'Marketing', trend: 'stable', trendValue: -0.1, dataQuality: 76, affiliateUrl: 'https://problogger.com', roles: ['Marketing', 'Designer', 'Administrative'] },
  { id: 39, name: 'Proofreads', url: 'https://proofreads.com', industry: 'Creative & Media', score: 68, grade: 'D', avgLifespan: 24, repostRate: 13.2, totalPostings: 600, topRole: 'Administrative', trend: 'down', trendValue: -0.8, dataQuality: 73, affiliateUrl: 'https://proofreads.com', roles: ['Administrative', 'Marketing', 'Designer'] },
  { id: 40, name: 'Design Observer', url: 'https://designobserver.com/opportunities', industry: 'Creative & Media', score: 72, grade: 'C', avgLifespan: 20, repostRate: 11.0, totalPostings: 700, topRole: 'Designer', trend: 'stable', trendValue: 0.0, dataQuality: 77, affiliateUrl: 'https://designobserver.com/opportunities', roles: ['Designer', 'Marketing'] },
  { id: 41, name: 'CreativeMornings', url: 'https://creativemornings.com', industry: 'Creative & Media', score: 70, grade: 'C', avgLifespan: 22, repostRate: 12.1, totalPostings: 750, topRole: 'Designer', trend: 'stable', trendValue: 0.0, dataQuality: 75, affiliateUrl: 'https://creativemornings.com', roles: ['Designer', 'Marketing'] },

  // Finance & Accounting (5 boards)
  { id: 42, name: 'eFinancialCareers', url: 'https://efinancialcareers.com', industry: 'Finance & Accounting', score: 81, grade: 'B', avgLifespan: 13, repostRate: 7.5, totalPostings: 2200, topRole: 'Accountant', trend: 'up', trendValue: 2.0, dataQuality: 88, affiliateUrl: 'https://efinancialcareers.com', roles: ['Accountant', 'Finance Manager', 'Manager'] },
  { id: 43, name: 'AccountingJobsToday', url: 'https://accountingjobstoday.com', industry: 'Finance & Accounting', score: 76, grade: 'C', avgLifespan: 16, repostRate: 10.2, totalPostings: 1500, topRole: 'Accountant', trend: 'stable', trendValue: 0.5, dataQuality: 82, affiliateUrl: 'https://accountingjobstoday.com', roles: ['Accountant', 'Finance Manager'] },
  { id: 44, name: 'FinancialJobBank', url: 'https://financialjobbank.com', industry: 'Finance & Accounting', score: 73, grade: 'C', avgLifespan: 18, repostRate: 11.1, totalPostings: 1200, topRole: 'Finance Manager', trend: 'stable', trendValue: 0.0, dataQuality: 79, affiliateUrl: 'https://financialjobbank.com', roles: ['Finance Manager', 'Accountant', 'Manager'] },
  { id: 45, name: 'Banking Jobs Board', url: 'https://bankingjobs.com', industry: 'Finance & Accounting', score: 72, grade: 'C', avgLifespan: 19, repostRate: 11.8, totalPostings: 1100, topRole: 'Finance Manager', trend: 'stable', trendValue: -0.2, dataQuality: 78, affiliateUrl: 'https://bankingjobs.com', roles: ['Finance Manager', 'Manager', 'Operations'] },
  { id: 46, name: 'CFO Jobs', url: 'https://cfojobs.com', industry: 'Finance & Accounting', score: 74, grade: 'C', avgLifespan: 15, repostRate: 8.9, totalPostings: 850, topRole: 'Finance Manager', trend: 'stable', trendValue: 0.1, dataQuality: 80, affiliateUrl: 'https://cfojobs.com', roles: ['Finance Manager', 'Manager', 'Accountant'] },

  // Education (5 boards)
  { id: 47, name: 'Chronicle Jobs', url: 'https://jobs.chronicle.org', industry: 'Education', score: 77, grade: 'C', avgLifespan: 17, repostRate: 9.8, totalPostings: 1100, topRole: 'Manager', trend: 'stable', trendValue: 0.2, dataQuality: 83, affiliateUrl: 'https://jobs.chronicle.org', roles: ['Manager', 'Administrative', 'Health Professional'] },
  { id: 48, name: 'HigherEdJobs', url: 'https://higheredjobs.com', industry: 'Education', score: 75, grade: 'C', avgLifespan: 18, repostRate: 10.5, totalPostings: 1300, topRole: 'Manager', trend: 'stable', trendValue: 0.0, dataQuality: 81, affiliateUrl: 'https://higheredjobs.com', roles: ['Manager', 'Administrative'] },
  { id: 49, name: 'K12JobSpot', url: 'https://k12jobspot.com', industry: 'Education', score: 73, grade: 'C', avgLifespan: 19, repostRate: 11.2, totalPostings: 1400, topRole: 'Manager', trend: 'stable', trendValue: 0.0, dataQuality: 79, affiliateUrl: 'https://k12jobspot.com', roles: ['Manager', 'Administrative', 'Marketing'] },
  { id: 50, name: 'TeachAway', url: 'https://teachaway.com', industry: 'Education', score: 71, grade: 'C', avgLifespan: 21, repostRate: 12.1, totalPostings: 950, topRole: 'Manager', trend: 'stable', trendValue: -0.3, dataQuality: 77, affiliateUrl: 'https://teachaway.com', roles: ['Manager', 'Administrative', 'Operations'] },
  { id: 51, name: 'Academic Jobs', url: 'https://academicjobs.org', industry: 'Education', score: 72, grade: 'C', avgLifespan: 20, repostRate: 10.8, totalPostings: 1050, topRole: 'Manager', trend: 'stable', trendValue: 0.0, dataQuality: 78, affiliateUrl: 'https://academicjobs.org', roles: ['Manager', 'Administrative', 'Sales'] },

  // Legal (4 boards)
  { id: 52, name: 'LawCrossing', url: 'https://lawcrossing.com', industry: 'Legal', score: 78, grade: 'B', avgLifespan: 14, repostRate: 8.9, totalPostings: 1800, topRole: 'Legal Professional', trend: 'stable', trendValue: 0.5, dataQuality: 85, affiliateUrl: 'https://lawcrossing.com', roles: ['Legal Professional', 'Manager', 'Administrative'] },
  { id: 53, name: 'NALP Jobs', url: 'https://jobs.nalp.org', industry: 'Legal', score: 75, grade: 'C', avgLifespan: 16, repostRate: 10.1, totalPostings: 1200, topRole: 'Legal Professional', trend: 'stable', trendValue: 0.0, dataQuality: 81, affiliateUrl: 'https://jobs.nalp.org', roles: ['Legal Professional', 'Manager', 'Administrative'] },
  { id: 54, name: 'LawJobs.com', url: 'https://lawjobs.com', industry: 'Legal', score: 73, grade: 'C', avgLifespan: 18, repostRate: 11.2, totalPostings: 1400, topRole: 'Legal Professional', trend: 'stable', trendValue: 0.0, dataQuality: 79, affiliateUrl: 'https://lawjobs.com', roles: ['Legal Professional', 'Manager'] },
  { id: 55, name: 'Legal Authority', url: 'https://legalauthority.com', industry: 'Legal', score: 70, grade: 'C', avgLifespan: 20, repostRate: 12.0, totalPostings: 950, topRole: 'Legal Professional', trend: 'stable', trendValue: -0.2, dataQuality: 76, affiliateUrl: 'https://legalauthority.com', roles: ['Legal Professional', 'Manager'] },

  // Construction (4 boards)
  { id: 56, name: 'ConstructionJobs.com', url: 'https://constructionjobs.com', industry: 'Construction', score: 72, grade: 'C', avgLifespan: 19, repostRate: 12.0, totalPostings: 2100, topRole: 'Manager', trend: 'stable', trendValue: 0.0, dataQuality: 78, affiliateUrl: 'https://constructionjobs.com', roles: ['Manager', 'Administrative', 'Operations'] },
  { id: 57, name: 'iHireConstruction', url: 'https://ihireconstruction.com', industry: 'Construction', score: 70, grade: 'C', avgLifespan: 21, repostRate: 12.8, totalPostings: 1600, topRole: 'Manager', trend: 'stable', trendValue: -0.1, dataQuality: 76, affiliateUrl: 'https://ihireconstruction.com', roles: ['Manager', 'Operations', 'Administrative'] },
  { id: 58, name: 'Roadtechs', url: 'https://roadtechs.com', industry: 'Construction', score: 68, grade: 'D', avgLifespan: 23, repostRate: 14.2, totalPostings: 900, topRole: 'Manager', trend: 'down', trendValue: -0.5, dataQuality: 74, affiliateUrl: 'https://roadtechs.com', roles: ['Manager', 'Operations', 'Administrative'] },
  { id: 59, name: 'Tradesmen International', url: 'https://tradesmeninternational.com', industry: 'Construction', score: 67, grade: 'D', avgLifespan: 24, repostRate: 14.9, totalPostings: 800, topRole: 'Operations', trend: 'down', trendValue: -0.8, dataQuality: 72, affiliateUrl: 'https://tradesmeninternational.com', roles: ['Operations', 'Manager', 'Administrative'] },

  // Manufacturing (4 boards)
  { id: 60, name: 'ManufacturingJobs.com', url: 'https://manufacturingjobs.com', industry: 'Manufacturing', score: 74, grade: 'C', avgLifespan: 18, repostRate: 10.5, totalPostings: 1800, topRole: 'Manager', trend: 'stable', trendValue: 0.1, dataQuality: 80, affiliateUrl: 'https://manufacturingjobs.com', roles: ['Manager', 'Operations', 'Administrator'] },
  { id: 61, name: 'iHireManufacturing', url: 'https://ihiremanufacturing.com', industry: 'Manufacturing', score: 71, grade: 'C', avgLifespan: 20, repostRate: 11.8, totalPostings: 1500, topRole: 'Operations', trend: 'stable', trendValue: -0.2, dataQuality: 77, affiliateUrl: 'https://ihiremanufacturing.com', roles: ['Operations', 'Manager', 'Administrative'] },
  { id: 62, name: 'Engineering.com Jobs', url: 'https://engineering.com/jobs', industry: 'Manufacturing', score: 76, grade: 'C', avgLifespan: 16, repostRate: 9.8, totalPostings: 1600, topRole: 'Developer', trend: 'stable', trendValue: 0.3, dataQuality: 81, affiliateUrl: 'https://engineering.com/jobs', roles: ['Developer', 'Manager', 'Operations', 'Data Scientist'] },
  { id: 63, name: 'Plant Jobs', url: 'https://plantjobs.com', industry: 'Manufacturing', score: 69, grade: 'D', avgLifespan: 22, repostRate: 13.1, totalPostings: 1200, topRole: 'Operations', trend: 'stable', trendValue: 0.0, dataQuality: 75, affiliateUrl: 'https://plantjobs.com', roles: ['Operations', 'Manager', 'Administrative'] },

  // Government (3 boards)
  { id: 64, name: 'USAJobs', url: 'https://usajobs.gov', industry: 'Government', score: 76, grade: 'C', avgLifespan: 20, repostRate: 10.5, totalPostings: 2200, topRole: 'Administrative', trend: 'stable', trendValue: 0.1, dataQuality: 82, affiliateUrl: 'https://usajobs.gov', roles: ['Administrative', 'Manager', 'Operations'] },
  { id: 65, name: 'Careers in Government', url: 'https://careersingovernment.com', industry: 'Government', score: 74, grade: 'C', avgLifespan: 21, repostRate: 11.0, totalPostings: 1200, topRole: 'Administrative', trend: 'stable', trendValue: 0.0, dataQuality: 80, affiliateUrl: 'https://careersingovernment.com', roles: ['Administrative', 'Manager', 'Operations'] },
  { id: 66, name: 'PublicServiceJobs', url: 'https://publicservicejobs.com', industry: 'Government', score: 71, grade: 'C', avgLifespan: 23, repostRate: 12.2, totalPostings: 1100, topRole: 'Administrative', trend: 'stable', trendValue: -0.3, dataQuality: 77, affiliateUrl: 'https://publicservicejobs.com', roles: ['Administrative', 'Operations', 'Manager'] },

  // Retail & Hospitality (4 boards)
  { id: 67, name: 'AllRetailJobs', url: 'https://allretailjobs.com', industry: 'Retail & Hospitality', score: 70, grade: 'D', avgLifespan: 23, repostRate: 13.5, totalPostings: 2800, topRole: 'Manager', trend: 'down', trendValue: -1.0, dataQuality: 76, affiliateUrl: 'https://allretailjobs.com', roles: ['Manager', 'Sales', 'Administrative', 'Operations'] },
  { id: 68, name: 'HCareers', url: 'https://hcareers.com', industry: 'Retail & Hospitality', score: 68, grade: 'D', avgLifespan: 24, repostRate: 14.8, totalPostings: 2200, topRole: 'Manager', trend: 'down', trendValue: -2.0, dataQuality: 73, affiliateUrl: 'https://hcareers.com', roles: ['Manager', 'Sales', 'Administrative'] },
  { id: 69, name: 'Poached Jobs', url: 'https://poachedjobs.com', industry: 'Retail & Hospitality', score: 67, grade: 'D', avgLifespan: 25, repostRate: 15.1, totalPostings: 1800, topRole: 'Manager', trend: 'down', trendValue: -1.5, dataQuality: 72, affiliateUrl: 'https://poachedjobs.com', roles: ['Manager', 'Sales', 'Administrative'] },
  { id: 70, name: 'Culinary Agents', url: 'https://culinaryagents.com', industry: 'Retail & Hospitality', score: 66, grade: 'D', avgLifespan: 26, repostRate: 15.8, totalPostings: 1500, topRole: 'Operations', trend: 'down', trendValue: -1.8, dataQuality: 70, affiliateUrl: 'https://culinaryagents.com', roles: ['Operations', 'Manager', 'Sales'] },

  // FlexJobs also in Technology (has tech roles)
  { id: 71, name: 'FlexJobs', url: 'https://flexjobs.com', industry: 'Technology', score: 82, grade: 'A', avgLifespan: 18, repostRate: 7.8, totalPostings: 2100, topRole: 'Full-Stack Engineer', trend: 'up', trendValue: 2.1, dataQuality: 88, affiliateUrl: 'https://flexjobs.com', roles: ['Full-Stack Engineer', 'Front-End Engineer', 'Developer', 'Designer', 'Product Manager'] },
]

/**
 * Calculate aggregated board metrics for insights page
 */
export function calculateBoardMetrics(boards: BoardData[] = FALLBACK_BOARDS) {
  const totalBoards = boards.length
  const avgScore = Math.round(boards.reduce((sum, b) => sum + b.score, 0) / totalBoards)
  const avgLifespan = Math.round(boards.reduce((sum, b) => sum + b.avgLifespan, 0) / totalBoards)
  const totalPostings = boards.reduce((sum, b) => sum + b.totalPostings, 0)
  
  const risingBoards = boards.filter(b => b.trend === 'up').sort((a, b) => b.score - a.score)
  const decliningBoards = boards.filter(b => b.trend === 'down').sort((a, b) => b.score - a.score)
  
  const bestOverall = boards.reduce((best, board) => 
    board.score > best.score ? board : best, boards[0] || boards[0])
  
  const worstPerformer = boards.reduce((worst, board) => 
    board.score < worst.score ? board : worst, boards[0] || boards[0])
  
  // Count roles
  const roleMap = new Map<string, number>()
  boards.forEach(board => {
    board.roles.forEach(role => {
      roleMap.set(role, (roleMap.get(role) || 0) + 1)
    })
  })
  
  const sortedRoles = Array.from(roleMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([role, count]) => ({ role, count }))
  
  return {
    totalBoards,
    avgScore,
    avgLifespan,
    totalPostings,
    risingBoards: risingBoards.slice(0, 5),
    decliningBoards: decliningBoards.slice(0, 5),
    bestOverall,
    worstPerformer,
    topRoles: sortedRoles,
  }
}
