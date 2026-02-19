export class ScraperError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ScraperError'
  }
}

export class NetworkError extends ScraperError {
  constructor(message: string, details?: any) {
    super('NETWORK_ERROR', message, details)
    this.name = 'NetworkError'
  }
}

export class ParseError extends ScraperError {
  constructor(message: string, details?: any) {
    super('PARSE_ERROR', message, details)
    this.name = 'ParseError'
  }
}

export class DatabaseError extends ScraperError {
  constructor(message: string, details?: any) {
    super('DATABASE_ERROR', message, details)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends ScraperError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, details)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends ScraperError {
  constructor(message: string, retryAfter?: number) {
    super('RATE_LIMIT_ERROR', message, { retryAfter })
    this.name = 'RateLimitError'
  }
}
