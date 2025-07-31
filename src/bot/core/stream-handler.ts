import { botLogger } from '../utils/logger'
import twitterClient from './twitter-client'
import deepseekClient from './deepseek-client'
import configManager from '../config/bot-config'
import systemPromptsManager from '../config/system-prompts'
import stateManager from './state-manager'

interface StreamHandlerStatus {
  isRunning: boolean
  lastPollTime: string | null
  mentionsProcessed: number
  errors: number
  startTime: string | null
}

class StreamHandler {
  private isRunning: boolean = false
  private pollInterval: NodeJS.Timeout | null = null
  private startTime: Date | null = null
  private mentionsProcessed: number = 0
  private errors: number = 0
  private lastPollTime: string | null = null

  constructor() {
    // Initialize stream handler
  }

  /**
   * Start the stream handler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      botLogger.warn('Stream handler is already running')
      return
    }

    this.isRunning = true
    this.startTime = new Date()
    this.mentionsProcessed = 0
    this.errors = 0

    botLogger.info('Stream handler started', {
      startTime: this.startTime.toISOString(),
      config: {
        username: configManager.getConfig().username,
        hashtag: configManager.getConfig().hashtag,
        enabled: configManager.getConfig().enabled
      }
    })

    // Start polling for mentions
    this.startPolling()
  }

  /**
   * Stop the stream handler
   */
  stop(): void {
    if (!this.isRunning) {
      botLogger.warn('Stream handler is not running')
      return
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }

    this.isRunning = false
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0

    botLogger.info('Stream handler stopped', {
      uptime,
      mentionsProcessed: this.mentionsProcessed,
      errors: this.errors,
      startTime: this.startTime?.toISOString(),
      stopTime: new Date().toISOString()
    })
  }

  /**
   * Start polling for mentions
   */
  private startPolling(): void {
    const config = configManager.getConfig()
    const pollIntervalMs = 2 * 60 * 1000 // Poll every 2 minutes

    botLogger.info('Starting mention polling', {
      intervalMs: pollIntervalMs,
      username: config.username,
      hashtag: config.hashtag
    })

    // Initial poll
    this.pollMentions()

    // Set up interval for subsequent polls
    this.pollInterval = setInterval(() => {
      this.pollMentions()
    }, pollIntervalMs)
  }

  /**
   * Poll for new mentions
   */
  private async pollMentions(): Promise<void> {
    try {
      const config = configManager.getConfig()
      const state = stateManager.getStateSummary()

      botLogger.info('Polling for mentions', {
        sinceId: state.lastMentionId,
        username: config.username,
        hashtag: config.hashtag,
        twitterCallsRemaining: state.twitterCallsRemaining
      })

      // Get mentions from Twitter
      const mentions = await twitterClient.getMentions(100, state.lastMentionId || undefined)

      if (mentions.length > 0) {
        botLogger.info('Found mentions', { count: mentions.length })
        
        // Process mentions in reverse order (oldest first)
        for (const mention of mentions.reverse()) {
          await this.processMention(mention)
        }
      } else {
        botLogger.debug('No new mentions found')
      }

      this.lastPollTime = new Date().toISOString()
      stateManager.setLastPollTime()

    } catch (error: any) {
      this.errors++
      botLogger.error('Error polling mentions', error)
    }
  }

  /**
   * Process a single mention
   */
  private async processMention(mention: any): Promise<void> {
    try {
      const config = configManager.getConfig()
      
      // Check if bot is enabled
      if (!config.enabled) {
        botLogger.debug('Bot is disabled, skipping mention')
        return
      }

      const tweetText = mention.text || ''
      const username = mention.user?.screen_name || mention.user?.username || ''
      const tweetId = mention.id_str || mention.id

      botLogger.mentionReceived(tweetId, username, tweetText)

      // Check if mention contains the required hashtag
      const hashtag = config.hashtag.toLowerCase()
      if (!tweetText.toLowerCase().includes(`#${hashtag}`)) {
        botLogger.debug('Mention does not contain required hashtag', {
          tweetText: tweetText.substring(0, 100),
          hashtag,
          username
        })
        return
      }

      // Check whitelist if enabled
      if (config.whitelistEnabled) {
        const isWhitelisted = configManager.isWhitelisted(username)
        if (!isWhitelisted) {
          botLogger.info('User not whitelisted, skipping mention', { username })
          return
        }
      }

      // Generate response using DeepSeek
      const response = await this.generateResponse(tweetText, username, tweetId)
      
      if (response) {
        // Post reply
        await twitterClient.replyToTweet(tweetId, response)
        
        this.mentionsProcessed++
        botLogger.replySent(tweetId, username, response, 0) // TODO: Add processing time
      }

    } catch (error: any) {
      this.errors++
      botLogger.error('Error processing mention', error, {
        mentionId: mention.id_str || mention.id,
        username: mention.user?.screen_name || mention.user?.username
      })
    }
  }

  /**
   * Generate response using DeepSeek
   */
  private async generateResponse(tweetText: string, username: string, tweetId: string): Promise<string | null> {
    try {
      const config = configManager.getConfig()
      const systemPrompt = systemPromptsManager.getCombinedSystemPrompt()

      const context = {
        originalTweet: tweetText,
        userMention: `@${username}`,
        hashtags: this.extractHashtags(tweetText),
        tweetId,
        userId: username,
        username
      }

      const request = {
        systemPrompt,
        userMessage: tweetText,
        context,
        config: deepseekClient.getCurrentConfig()
      }

      const result = await deepseekClient.generateBotResponse(request)

      if (result.success && result.response) {
        // Truncate response to fit Twitter's character limit
        const maxLength = config.maxResponseLength || 280
        let response = result.response.trim()

        if (response.length > maxLength) {
          response = response.substring(0, maxLength - 3) + '...'
        }

        return response
      } else {
        botLogger.error('Failed to generate response', undefined, {
          error: result.error,
          tweetId,
          username
        })
        return null
      }

    } catch (error: any) {
      botLogger.error('Error generating response', error, {
        tweetId,
        username
      })
      return null
    }
  }

  /**
   * Extract hashtags from tweet text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g
    return text.match(hashtagRegex) || []
  }

  /**
   * Get stream handler status
   */
  getStatus(): StreamHandlerStatus {
    return {
      isRunning: this.isRunning,
      lastPollTime: this.lastPollTime,
      mentionsProcessed: this.mentionsProcessed,
      errors: this.errors,
      startTime: this.startTime?.toISOString() || null
    }
  }

  /**
   * Get retry information
   */
  getRetryInfo(): {
    lastRetry: string | null
    retryCount: number
    maxRetries: number
    retryDelay: number
  } {
    return {
      lastRetry: null, // Not implemented yet
      retryCount: 0,
      maxRetries: 3,
      retryDelay: 5000 // 5 seconds
    }
  }

  /**
   * Clear stream handler cache
   */
  clearCache(): void {
    this.mentionsProcessed = 0
    this.errors = 0
    this.lastPollTime = null
    
    // Note: Cannot clear lastMentionId as it expects a string
    // The state manager will handle this appropriately
    
    botLogger.info('Stream handler cache cleared')
  }
}

// Create singleton instance
const streamHandler = new StreamHandler()

export default streamHandler
