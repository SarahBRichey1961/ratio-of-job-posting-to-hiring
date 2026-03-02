/**
 * Job Provider System
 * Unified interface for integrating multiple job APIs
 *
 * Usage:
 * const orchestrator = new JobSearchOrchestrator([
 *   new AdzunaProvider(),
 *   new JSearchProvider(),
 *   new IndeedProvider(),
 *   new StackOverflowProvider(),
 *   new LinkedInProvider(),
 * ])
 *
 * const results = await orchestrator.search({
 *   query: "Software Engineer",
 *   jobType: "remote",
 *   limit: 50,
 * })
 */

export * from './types'
export * from './BaseJobProvider'
export * from './AdzunaProvider'
export * from './JSearchProvider'
export * from './IndeedProvider'
export * from './LinkedInProvider'
export * from './StackOverflowProvider'
export * from './JobSearchOrchestrator'
