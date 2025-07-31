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

class StreamHandler {
  private isRunning: boolean = false
  private pollInterval: NodeJS.Timeout | null = null
  private lastMentionId: string | null = null
  private processedMentions: Set<string> = new Set()
  private config = configManager.getConfig()

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
      pollInterval: '60 seconds'
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

      // Generate response
      const response = await this.generateResponse(mention)
      
      if (response) {
        // Post reply
        await this.postReply(mentionId, response)
        
        botLogger.info('Successfully processed mention', {
          mentionId,
          username: mention.user?.screen_name,
          responseLength: response.length
        })
      }

      this.processedMentions.add(mentionId)

    } catch (error: any) {
      botLogger.error('Error processing mention', error, {
        mentionId,
        username: mention.user?.screen_name
      })
      this.processedMentions.add(mentionId)
    }
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
      config: {
        enabled: this.config.enabled,
        username: this.config.username,
        hashtag: this.config.hashtag,
        whitelistEnabled: this.config.whitelistEnabled
      }
    }
  }

  /**
   * Clear processed mentions cache
   */
  clearCache(): void {
    this.processedMentions.clear()
    botLogger.info('Stream handler cache cleared')
  }
}

// Create singleton instance
const streamHandler = new StreamHandler()

export default streamHandler 