// Bot Configuration Types

export interface BotConfig {
  enabled: boolean
  username: string
  hashtag: string
  whitelistEnabled: boolean
  systemPrompts: Record<string, boolean>
  rateLimits: {
    twitter: number
    deepseek: number
  }
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug'
    filePath: string
  }
}

export interface WhitelistEntry {
  username: string
  addedAt: string
  addedBy: string
  reason?: string
}

export interface BotStatus {
  isRunning: boolean
  lastActivity: string
  totalReplies: number
  errorsToday: number
  apiStatus: {
    twitter: 'connected' | 'disconnected' | 'error'
    deepseek: 'connected' | 'disconnected' | 'error'
  }
  rateLimits: {
    twitter: {
      remaining: number
      resetTime: string
    }
    deepseek: {
      remaining: number
      resetTime: string
    }
  }
}

export interface BotActivity {
  id: string
  timestamp: string
  type: 'mention_received' | 'reply_sent' | 'error' | 'whitelist_updated' | 'config_updated'
  details: {
    tweetId?: string
    username?: string
    response?: string
    error?: string
    configKey?: string
    oldValue?: any
    newValue?: any
  }
}

export interface BotMetrics {
  totalMentions: number
  totalReplies: number
  totalErrors: number
  averageResponseTime: number
  topHashtags: Array<{
    hashtag: string
    count: number
  }>
  topUsers: Array<{
    username: string
    mentionCount: number
  }>
  dailyStats: Array<{
    date: string
    mentions: number
    replies: number
    errors: number
  }>
}

// Bot Event Types
export interface BotEvent {
  type: 'mention' | 'error' | 'config_change' | 'whitelist_change'
  timestamp: string
  data: any
}

export interface MentionEvent {
  tweet: {
    id: string
    text: string
    user: {
      id: string
      username: string
      screenName: string
    }
    createdAt: string
    hashtags: string[]
    mentions: string[]
  }
  requiresResponse: boolean
  whitelistCheck: boolean
}

export interface ErrorEvent {
  error: string
  context: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Bot Response Types
export interface BotResponse {
  success: boolean
  tweetId?: string
  responseText?: string
  error?: string
  timestamp: string
  processingTime: number
}

export interface ResponseValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Bot Configuration Validation
export interface ConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missingEnvVars: string[]
}

// Bot Health Check
export interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical'
  checks: {
    twitterApi: 'ok' | 'error' | 'rate_limited'
    deepseekApi: 'ok' | 'error' | 'rate_limited'
    configFile: 'ok' | 'error' | 'missing'
    whitelistFile: 'ok' | 'error' | 'missing'
    logFile: 'ok' | 'error' | 'unwritable'
  }
  lastCheck: string
  uptime: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
}

// Bot Logging Types
export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

export interface LogConfig {
  level: 'error' | 'warn' | 'info' | 'debug'
  filePath: string
  maxSize: number
  maxFiles: number
  format: 'json' | 'text'
}

// Bot Rate Limiting
export interface RateLimitConfig {
  twitter: {
    postsPer15Min: number
    searchPer15Min: number
    streamConnections: number
  }
  deepseek: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface RateLimitStatus {
  twitter: {
    posts: {
      remaining: number
      resetTime: string
    }
    search: {
      remaining: number
      resetTime: string
    }
  }
  deepseek: {
    requests: {
      remaining: number
      resetTime: string
    }
    tokens: {
      remaining: number
      resetTime: string
    }
  }
} 