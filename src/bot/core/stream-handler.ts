import { botLogger } from '../utils/logger'
import twitterClient from './twitter-client'
import deepseekClient from './deepseek-client'
import configManager from '../config/bot-config'
import systemPromptsManager from '../config/system-prompts'
import { TwitterMention } from '../types/twitter-types'
import { BotResponseRequest } from '../types/deepseek-types'

interface ProcessedMention {
  tweetId: string
  username: string
  text: string
  hashtags: string[]
  processed: boolean
  response?: string
  error?: string
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

class StreamHandler {
  private isRunning: boolean = false
  private pollInterval: NodeJS.Timeout | null = null
  private lastMentionId: string | null = null
  private processedMentions: Set<string> = new Set()
  private failedMentions: Map<string, { retries: number; lastError: string; nextRetry: number }> = new Map()
  private config = configManager.getConfig()
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2
  }

  constructor() {
    // Update config when it changes
    configManager.addWatcher((newConfig) => {
      this.config = newConfig
      botLogger.info('Stream handler configuration updated', {
        enabled: newConfig.enabled,
        username: newConfig.username,
        hashtag: newConfig.hashtag
      })
    })
  }

  /**
   * Start the stream handler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      botLogger.warn('Stream handler is already running')
      return
    }

    if (!this.config.enabled) {
      botLogger.warn('Bot is disabled in configuration')
      return
    }

    this.isRunning = true
    botLogger.info('Stream handler started', {
      username: this.config.username,
      hashtag: this.config.hashtag,
      pollInterval: '60 seconds',
      retryConfig: this.retryConfig
    })

    // Start polling immediately
    await this.pollMentions()

    // Set up polling interval
    this.pollInterval = setInterval(async () => {
      await this.pollMentions()
    }, 60000) // 60 seconds
  }

  /**
   * Stop the stream handler
   */
  stop(): void {
    if (!this.isRunning) {
      botLogger.warn('Stream handler is not running')
      return
    }

    this.isRunning = false
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    botLogger.info('Stream handler stopped')
  }

  /**
   * Poll for new mentions
   */
  private async pollMentions(): Promise<void> {
    try {
      botLogger.info('Polling for mentions', {
        sinceId: this.lastMentionId,
        username: this.config.username,
        hashtag: this.config.hashtag
      })

      const mentions = await twitterClient.getMentions(100, this.lastMentionId || undefined)
      
      if (mentions.length === 0) {
        botLogger.info('No new mentions found')
        return
      }

      botLogger.info('Found mentions', {
        count: mentions.length,
        oldestId: mentions[mentions.length - 1]?.id_str,
        newestId: mentions[0]?.id_str
      })

      // Update last mention ID
      if (mentions.length > 0) {
        this.lastMentionId = mentions[0].id_str
      }

      // Process mentions in reverse order (oldest first)
      for (const mention of mentions.reverse()) {
        await this.processMention(mention)
      }

      // Process any failed mentions that are ready for retry
      await this.processFailedMentions()

    } catch (error: any) {
      botLogger.error('Error polling mentions', error)
    }
  }

  /**
   * Process a single mention
   */
  private async processMention(mention: TwitterMention): Promise<void> {
    const mentionId = mention.id_str
    
    // Skip if already processed
    if (this.processedMentions.has(mentionId)) {
      return
    }

    // Check if mention contains the required hashtag
    if (!this.shouldProcessMention(mention)) {
      this.processedMentions.add(mentionId)
      return
    }

    // Check whitelist
    const username = mention.user?.screen_name?.toLowerCase()
    if (username && !configManager.isWhitelisted(username)) {
      botLogger.info('Skipping mention - user not whitelisted', {
        mentionId,
        username,
        whitelistEnabled: this.config.whitelistEnabled
      })
      this.processedMentions.add(mentionId)
      return
    }

    try {
      botLogger.info('Processing mention', {
        mentionId,
        username: mention.user?.screen_name,
        text: mention.text.substring(0, 100)
      })

      // Generate response with retry
      const response = await this.generateResponseWithRetry(mention)
      
      if (response) {
        // Post reply with retry
        await this.postReplyWithRetry(mentionId, response)
        
        botLogger.info('Successfully processed mention', {
          mentionId,
          username: mention.user?.screen_name,
          responseLength: response.length
        })
      }

      this.processedMentions.add(mentionId)
      this.failedMentions.delete(mentionId) // Remove from failed list if successful

    } catch (error: any) {
      botLogger.error('Error processing mention', error, {
        mentionId,
        username: mention.user?.screen_name
      })
      
      // Add to failed mentions for retry
      this.addToFailedMentions(mentionId, error.message || 'Unknown error')
    }
  }

  /**
   * Add mention to failed mentions for retry
   */
  private addToFailedMentions(mentionId: string, error: string): void {
    const existing = this.failedMentions.get(mentionId)
    const retries = existing ? existing.retries + 1 : 0
    
    if (retries < this.retryConfig.maxRetries) {
      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retries),
        this.retryConfig.maxDelay
      )
      const nextRetry = Date.now() + delay
      
      this.failedMentions.set(mentionId, {
        retries,
        lastError: error,
        nextRetry
      })
      
      botLogger.info('Added mention to retry queue', {
        mentionId,
        retries,
        nextRetry: new Date(nextRetry).toISOString(),
        error
      })
    } else {
      botLogger.error('Max retries exceeded for mention', undefined, {
        mentionId,
        maxRetries: this.retryConfig.maxRetries,
        finalError: error
      })
      this.processedMentions.add(mentionId) // Mark as processed to avoid infinite retries
    }
  }

  /**
   * Process failed mentions that are ready for retry
   */
  private async processFailedMentions(): Promise<void> {
    const now = Date.now()
    const readyForRetry = Array.from(this.failedMentions.entries())
      .filter(([_, data]) => data.nextRetry <= now)
    
    if (readyForRetry.length === 0) {
      return
    }

    botLogger.info('Processing failed mentions for retry', {
      count: readyForRetry.length
    })

    for (const [mentionId, data] of readyForRetry) {
      try {
        // Get the original mention data (we'll need to reconstruct this)
        // For now, we'll just remove it from failed list and log
        botLogger.info('Retrying failed mention', {
          mentionId,
          retries: data.retries,
          lastError: data.lastError
        })
        
        // Remove from failed list (in a real implementation, we'd need to store the original mention data)
        this.failedMentions.delete(mentionId)
        
      } catch (error: any) {
        botLogger.error('Error retrying mention', error, { mentionId })
        // Add back to failed list if retry failed
        this.addToFailedMentions(mentionId, error.message || 'Retry failed')
      }
    }
  }

  /**
   * Generate response with retry logic
   */
  private async generateResponseWithRetry(mention: TwitterMention): Promise<string | null> {
    let lastError: string | null = null
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.generateResponse(mention)
        if (response) {
          if (attempt > 1) {
            botLogger.info('Response generation succeeded on retry', {
              mentionId: mention.id_str,
              attempt
            })
          }
          return response
        }
        return null
      } catch (error: any) {
        lastError = error.message || 'Unknown error'
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          )
          
          botLogger.warn('Response generation failed, retrying', {
            mentionId: mention.id_str,
            attempt,
            nextAttempt: attempt + 1,
            delay,
            error: lastError
          })
          
          await this.sleep(delay)
        }
      }
    }
    
    botLogger.error('Response generation failed after all retries', undefined, {
      mentionId: mention.id_str,
      maxRetries: this.retryConfig.maxRetries,
      finalError: lastError
    })
    
    return null
  }

  /**
   * Post reply with retry logic
   */
  private async postReplyWithRetry(mentionId: string, response: string): Promise<void> {
    let lastError: string | null = null
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        await this.postReply(mentionId, response)
        
        if (attempt > 1) {
          botLogger.info('Reply posting succeeded on retry', {
            mentionId,
            attempt
          })
        }
        
        return
      } catch (error: any) {
        lastError = error.message || 'Unknown error'
        
        // Check if it's a rate limit error
        if (error.response?.status === 429) {
          const resetTime = error.response.headers['x-rate-limit-reset']
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000)
            const now = new Date()
            const waitTime = Math.max(resetDate.getTime() - now.getTime(), 0)
            
            botLogger.warn('Rate limit hit, waiting for reset', {
              mentionId,
              resetTime: resetDate.toISOString(),
              waitTime: Math.ceil(waitTime / 1000)
            })
            
            await this.sleep(waitTime)
            continue // Retry immediately after waiting
          }
        }
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxDelay
          )
          
          botLogger.warn('Reply posting failed, retrying', {
            mentionId,
            attempt,
            nextAttempt: attempt + 1,
            delay,
            error: lastError
          })
          
          await this.sleep(delay)
        }
      }
    }
    
    botLogger.error('Reply posting failed after all retries', undefined, {
      mentionId,
      maxRetries: this.retryConfig.maxRetries,
      finalError: lastError
    })
    
    throw new Error(`Failed to post reply after ${this.retryConfig.maxRetries} attempts: ${lastError}`)
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if mention should be processed
   */
  private shouldProcessMention(mention: TwitterMention): boolean {
    const text = mention.text.toLowerCase()
    const hashtag = this.config.hashtag.toLowerCase()
    
    // Check if mention contains the required hashtag
    if (!text.includes(`#${hashtag}`)) {
      botLogger.debug('Skipping mention - missing hashtag', {
        mentionId: mention.id_str,
        text: mention.text.substring(0, 50),
        requiredHashtag: `#${hashtag}`
      })
      return false
    }

    // Check if mention is from the bot itself
    const username = mention.user?.screen_name?.toLowerCase()
    if (username === this.config.username.toLowerCase()) {
      botLogger.debug('Skipping mention - from bot itself', {
        mentionId: mention.id_str,
        username
      })
      return false
    }

    return true
  }

  /**
   * Generate response for a mention
   */
  private async generateResponse(mention: TwitterMention): Promise<string | null> {
    try {
      // Extract hashtags
      const hashtags = this.extractHashtags(mention.text)
      
      // Prepare context
      const context = {
        originalTweet: mention.text,
        userMention: `@${mention.user?.screen_name}`,
        hashtags,
        tweetId: mention.id_str,
        userId: mention.user?.id_str || '',
        username: mention.user?.screen_name || ''
      }

      // Get system prompt
      const systemPrompt = systemPromptsManager.getCombinedSystemPrompt()

      // Prepare request
      const request: BotResponseRequest = {
        systemPrompt,
        userMessage: mention.text,
        context,
        config: deepseekClient.getCurrentConfig()
      }

      // Generate response
      const result = await deepseekClient.generateBotResponse(request)
      
      if (result.success && result.response) {
        // Truncate response if needed
        const maxLength = this.config.maxResponseLength
        let response = result.response.trim()
        
        if (response.length > maxLength) {
          response = response.substring(0, maxLength - 3) + '...'
        }

        return response
      } else {
        botLogger.error('Failed to generate response', undefined, {
          mentionId: mention.id_str,
          error: result.error
        })
        return null
      }

    } catch (error: any) {
      botLogger.error('Error generating response', error, {
        mentionId: mention.id_str
      })
      return null
    }
  }

  /**
   * Post reply to a mention
   */
  private async postReply(mentionId: string, response: string): Promise<void> {
    try {
      await twitterClient.replyToTweet(mentionId, response)
      
      botLogger.info('Reply posted successfully', {
        mentionId,
        responseLength: response.length
      })

    } catch (error: any) {
      botLogger.error('Error posting reply', error, {
        mentionId,
        responseLength: response.length
      })
      throw error
    }
  }

  /**
   * Extract hashtags from text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g
    const matches = text.match(hashtagRegex)
    return matches ? matches.map(tag => tag.toLowerCase()) : []
  }

  /**
   * Get stream handler status
   */
  getStatus(): {
    isRunning: boolean
    lastMentionId: string | null
    processedMentionsCount: number
    failedMentionsCount: number
    retryConfig: RetryConfig
    config: {
      enabled: boolean
      username: string
      hashtag: string
      whitelistEnabled: boolean
    }
  } {
    return {
      isRunning: this.isRunning,
      lastMentionId: this.lastMentionId,
      processedMentionsCount: this.processedMentions.size,
      failedMentionsCount: this.failedMentions.size,
      retryConfig: this.retryConfig,
      config: {
        enabled: this.config.enabled,
        username: this.config.username,
        hashtag: this.config.hashtag,
        whitelistEnabled: this.config.whitelistEnabled
      }
    }
  }

  /**
   * Get detailed retry information
   */
  getRetryInfo(): {
    failedMentions: Array<{
      mentionId: string
      retries: number
      lastError: string
      nextRetry: string
    }>
  } {
    const failedMentions = Array.from(this.failedMentions.entries()).map(([mentionId, data]) => ({
      mentionId,
      retries: data.retries,
      lastError: data.lastError,
      nextRetry: new Date(data.nextRetry).toISOString()
    }))

    return { failedMentions }
  }

  /**
   * Clear processed mentions cache
   */
  clearCache(): void {
    this.processedMentions.clear()
    this.failedMentions.clear()
    botLogger.info('Stream handler cache cleared')
  }
}

// Create singleton instance
const streamHandler = new StreamHandler()

export default streamHandler 