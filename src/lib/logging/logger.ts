import fs from 'fs'
import path from 'path'

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: string
}

export class Logger {
  private logDir: string
  private logFile: string
  private minLevel: LogLevel

  constructor(logDir: string = 'logs', minLevel: LogLevel = LogLevel.INFO) {
    this.logDir = logDir
    this.minLevel = minLevel

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    this.logFile = path.join(logDir, `scraper-${timestamp}.log`)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatLog(entry: LogEntry): string {
    let message = `[${entry.timestamp}] [${entry.level}] ${entry.message}`
    if (entry.data) {
      message += ` ${JSON.stringify(entry.data)}`
    }
    if (entry.error) {
      message += ` | Error: ${entry.error}`
    }
    return message
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message + '\n')
    } catch (err) {
      console.error('Failed to write to log file:', err)
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
    }

    const formatted = this.formatLog(entry)
    console.debug(formatted)
    this.writeToFile(formatted)
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
    }

    const formatted = this.formatLog(entry)
    console.log(formatted)
    this.writeToFile(formatted)
  }

  warn(message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
      error: error?.message,
    }

    const formatted = this.formatLog(entry)
    console.warn(formatted)
    this.writeToFile(formatted)
  }

  error(message: string, error: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data,
      error: error.message + '\n' + error.stack,
    }

    const formatted = this.formatLog(entry)
    console.error(formatted)
    this.writeToFile(formatted)
  }

  getLogFile(): string {
    return this.logFile
  }
}
