import winston from 'winston'
import path from 'path'
import { PATHS, LOG_LEVELS } from '../../shared/constants'

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    return log
  })
)

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || LOG_LEVELS.INFO,
  format: logFormat,
  defaultMeta: { service: 'xbot' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: PATHS.LOG_FILE,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Separate error file
    new winston.transports.File({
      filename: path.join(PATHS.LOGS_DIR, 'error.log'),
      level: LOG_LEVELS.ERROR,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
})

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }))
}

// Log rotation and cleanup
const cleanupOldLogs = () => {
  const fs = require('fs')
  const logDir = PATHS.LOGS_DIR
  
  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir)
      const now = Date.now()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
      
      files.forEach((file: string) => {
        const filePath = path.join(logDir, file)
        const stats = fs.statSync(filePath)
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath)
          logger.info(`Cleaned up old log file: ${file}`)
        }
      })
    }
  } catch (error: any) {
    logger.error('Error cleaning up old logs', { error: error?.message || 'Unknown error' })
  }
}

// Schedule log cleanup (daily at 2 AM)
const schedule = require('node-cron')
schedule.schedule('0 2 * * *', cleanupOldLogs, {
  scheduled: false
})

// Bot-specific logging methods
export const botLogger = {
  // Info logging
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta)
  },

  // Warning logging
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta)
  },

  // Error logging
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta
    })
  },

  // Debug logging
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta)
  },

  // Bot activity logging
  activity: (type: string, details: Record<string, any>) => {
    logger.info(`Bot Activity: ${type}`, {
      type,
      timestamp: new Date().toISOString(),
      ...details
    })
  },

  // API request logging
  apiRequest: (service: 'twitter' | 'deepseek', endpoint: string, meta?: Record<string, any>) => {
    logger.info(`API Request: ${service} - ${endpoint}`, {
      service,
      endpoint,
      timestamp: new Date().toISOString(),
      ...meta
    })
  },

  // API response logging
  apiResponse: (service: 'twitter' | 'deepseek', endpoint: string, statusCode: number, meta?: Record<string, any>) => {
    logger.info(`API Response: ${service} - ${endpoint}`, {
      service,
      endpoint,
      statusCode,
      timestamp: new Date().toISOString(),
      ...meta
    })
  },

  // Rate limit logging
  rateLimit: (service: 'twitter' | 'deepseek', remaining: number, resetTime: string) => {
    logger.warn(`Rate Limit: ${service}`, {
      service,
      remaining,
      resetTime,
      timestamp: new Date().toISOString()
    })
  },

  // Mention received logging
  mentionReceived: (tweetId: string, username: string, text: string) => {
    logger.info('Mention Received', {
      tweetId,
      username,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    })
  },

  // Reply sent logging
  replySent: (tweetId: string, username: string, responseText: string, processingTime: number) => {
    logger.info('Reply Sent', {
      tweetId,
      username,
      responseText: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''),
      processingTime,
      timestamp: new Date().toISOString()
    })
  },

  // Error with context
  botError: (context: string, error: Error, meta?: Record<string, any>) => {
    logger.error(`Bot Error in ${context}`, {
      context,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...meta
    })
  },

  // Configuration change logging
  configChange: (key: string, oldValue: any, newValue: any) => {
    logger.info('Configuration Changed', {
      key,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    })
  },

  // Whitelist change logging
  whitelistChange: (action: 'add' | 'remove', username: string, reason?: string) => {
    logger.info('Whitelist Changed', {
      action,
      username,
      reason,
      timestamp: new Date().toISOString()
    })
  }
}

// Health check for logger
export const checkLoggerHealth = () => {
  try {
    const fs = require('fs')
    const logFile = PATHS.LOG_FILE
    const logDir = PATHS.LOGS_DIR
    
    // Check if log directory exists and is writable
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    // Test write to log file
    const testMessage = 'Logger health check'
    logger.info(testMessage)
    
    return {
      status: 'healthy',
      logFile: fs.existsSync(logFile),
      logDir: fs.existsSync(logDir),
      writable: true
    }
  } catch (error: any) {
    return {
      status: 'error',
      error: error?.message || 'Unknown error',
      logFile: false,
      logDir: false,
      writable: false
    }
  }
}

export default logger 