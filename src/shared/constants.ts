// Bot Configuration Constants
export const BOT_CONFIG = {
  USERNAME: process.env.BOT_USERNAME || 'recapitul8r',
  HASHTAG: process.env.BOT_HASHTAG || 'hey',
  ENABLED: process.env.BOT_ENABLED === 'true',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  TWITTER: {
    BASE_URL: 'https://api.twitter.com/2',
    STREAM_URL: 'https://api.twitter.com/2',
    UPLOAD_URL: 'https://upload.twitter.com/1.1',
  },
  DEEPSEEK: {
    BASE_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
    CHAT_COMPLETIONS: '/chat/completions',
  },
} as const

// Rate Limiting Constants
export const RATE_LIMITS = {
  TWITTER: {
    POSTS_PER_15_MIN: parseInt(process.env.TWITTER_RATE_LIMIT || '300'),
    SEARCH_PER_15_MIN: 450,
    STREAM_CONNECTIONS: 1,
  },
  DEEPSEEK: {
    REQUESTS_PER_MINUTE: parseInt(process.env.DEEPSEEK_RATE_LIMIT || '100'),
    TOKENS_PER_MINUTE: 10000,
  },
} as const

// File Paths
export const PATHS = {
  DATA_DIR: '/data',
  CONFIG_FILE: '/data/config.json',
  WHITELIST_FILE: '/data/whitelist.json',
  LOGS_DIR: '/data/logs',
  LOG_FILE: '/data/logs/bot.log',
} as const

// Web Interface Constants
export const WEB_CONFIG = {
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',
  PASSWORD: process.env.WEB_PASSWORD || 'admin',
  PORT: parseInt(process.env.PORT || '3000'),
} as const

// Logging Levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const 