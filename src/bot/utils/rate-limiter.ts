import { RATE_LIMITS } from '@/shared/constants'
import { botLogger } from './logger'

interface RateLimitBucket {
  tokens: number
  lastRefill: number
  capacity: number
  refillRate: number // tokens per millisecond
}

interface RateLimitConfig {
  capacity: number
  refillRate: number
  windowMs: number
}

class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map()
  private configs: Map<string, RateLimitConfig> = new Map()

  constructor() {
    // Initialize rate limit configurations
    this.configs.set('twitter_posts', {
      capacity: RATE_LIMITS.TWITTER.POSTS_PER_15_MIN,
      refillRate: RATE_LIMITS.TWITTER.POSTS_PER_15_MIN / (15 * 60 * 1000), // tokens per ms
      windowMs: 15 * 60 * 1000 // 15 minutes
    })

    this.configs.set('twitter_search', {
      capacity: RATE_LIMITS.TWITTER.SEARCH_PER_15_MIN,
      refillRate: RATE_LIMITS.TWITTER.SEARCH_PER_15_MIN / (15 * 60 * 1000),
      windowMs: 15 * 60 * 1000
    })

    this.configs.set('deepseek_requests', {
      capacity: RATE_LIMITS.DEEPSEEK.REQUESTS_PER_MINUTE,
      refillRate: RATE_LIMITS.DEEPSEEK.REQUESTS_PER_MINUTE / (60 * 1000), // tokens per ms
      windowMs: 60 * 1000 // 1 minute
    })

    this.configs.set('deepseek_tokens', {
      capacity: RATE_LIMITS.DEEPSEEK.TOKENS_PER_MINUTE,
      refillRate: RATE_LIMITS.DEEPSEEK.TOKENS_PER_MINUTE / (60 * 1000),
      windowMs: 60 * 1000
    })
  }

  private getBucket(key: string): RateLimitBucket {
    if (!this.buckets.has(key)) {
      const config = this.configs.get(key)
      if (!config) {
        throw new Error(`No rate limit configuration found for key: ${key}`)
      }

      this.buckets.set(key, {
        tokens: config.capacity,
        lastRefill: Date.now(),
        capacity: config.capacity,
        refillRate: config.refillRate
      })
    }

    return this.buckets.get(key)!
  }

  private refillBucket(bucket: RateLimitBucket): void {
    const now = Date.now()
    const timePassed = now - bucket.lastRefill
    const tokensToAdd = timePassed * bucket.refillRate

    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }

  /**
   * Check if a request can be made
   * @param key Rate limit key
   * @param tokens Number of tokens required (default: 1)
   * @returns Object with allowed status and wait time
   */
  canMakeRequest(key: string, tokens: number = 1): { allowed: boolean; waitTime: number; remaining: number } {
    const bucket = this.getBucket(key)
    this.refillBucket(bucket)

    const allowed = bucket.tokens >= tokens
    const remaining = Math.max(0, bucket.tokens - tokens)
    
    if (allowed) {
      bucket.tokens = remaining
    }

    const waitTime = allowed ? 0 : this.calculateWaitTime(bucket, tokens)

    return {
      allowed,
      waitTime,
      remaining: bucket.tokens
    }
  }

  private calculateWaitTime(bucket: RateLimitBucket, tokens: number): number {
    const tokensNeeded = tokens - bucket.tokens
    return Math.ceil(tokensNeeded / bucket.refillRate)
  }

  /**
   * Wait for rate limit to allow request
   * @param key Rate limit key
   * @param tokens Number of tokens required
   * @returns Promise that resolves when request can be made
   */
  async waitForRateLimit(key: string, tokens: number = 1): Promise<void> {
    const result = this.canMakeRequest(key, tokens)
    
    if (result.allowed) {
      return
    }

    botLogger.rateLimit(key.split('_')[0] as 'twitter' | 'deepseek', result.remaining, new Date(Date.now() + result.waitTime).toISOString())
    
    return new Promise(resolve => {
      setTimeout(() => {
        this.waitForRateLimit(key, tokens).then(resolve)
      }, result.waitTime)
    })
  }

  /**
   * Get current rate limit status
   * @param key Rate limit key
   * @returns Current status
   */
  getStatus(key: string): { remaining: number; capacity: number; resetTime: number } {
    const bucket = this.getBucket(key)
    this.refillBucket(bucket)

    const config = this.configs.get(key)!
    const resetTime = bucket.lastRefill + config.windowMs

    return {
      remaining: bucket.tokens,
      capacity: bucket.capacity,
      resetTime
    }
  }

  /**
   * Reset rate limit bucket
   * @param key Rate limit key
   */
  reset(key: string): void {
    this.buckets.delete(key)
    botLogger.info(`Rate limit reset for key: ${key}`)
  }

  /**
   * Get all rate limit statuses
   */
  getAllStatuses(): Record<string, { remaining: number; capacity: number; resetTime: number }> {
    const statuses: Record<string, { remaining: number; capacity: number; resetTime: number }> = {}
    
    for (const key of this.configs.keys()) {
      statuses[key] = this.getStatus(key)
    }

    return statuses
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter()

// Twitter-specific rate limit methods
export const twitterRateLimiter = {
  canPost: (tokens: number = 1) => rateLimiter.canMakeRequest('twitter_posts', tokens),
  waitForPost: (tokens: number = 1) => rateLimiter.waitForRateLimit('twitter_posts', tokens),
  getPostStatus: () => rateLimiter.getStatus('twitter_posts'),
  
  canSearch: (tokens: number = 1) => rateLimiter.canMakeRequest('twitter_search', tokens),
  waitForSearch: (tokens: number = 1) => rateLimiter.waitForRateLimit('twitter_search', tokens),
  getSearchStatus: () => rateLimiter.getStatus('twitter_search')
}

// DeepSeek-specific rate limit methods
export const deepseekRateLimiter = {
  canMakeRequest: (tokens: number = 1) => rateLimiter.canMakeRequest('deepseek_requests', tokens),
  waitForRequest: (tokens: number = 1) => rateLimiter.waitForRateLimit('deepseek_requests', tokens),
  getRequestStatus: () => rateLimiter.getStatus('deepseek_requests'),
  
  canUseTokens: (tokens: number) => rateLimiter.canMakeRequest('deepseek_tokens', tokens),
  waitForTokens: (tokens: number) => rateLimiter.waitForRateLimit('deepseek_tokens', tokens),
  getTokenStatus: () => rateLimiter.getStatus('deepseek_tokens')
}

// General rate limiter methods
export const generalRateLimiter = {
  canMakeRequest: (key: string, tokens: number = 1) => rateLimiter.canMakeRequest(key, tokens),
  waitForRateLimit: (key: string, tokens: number = 1) => rateLimiter.waitForRateLimit(key, tokens),
  getStatus: (key: string) => rateLimiter.getStatus(key),
  getAllStatuses: () => rateLimiter.getAllStatuses(),
  reset: (key: string) => rateLimiter.reset(key)
}

export default rateLimiter 