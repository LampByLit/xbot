import dotenv from 'dotenv'
import { botLogger, checkLoggerHealth } from './utils/logger'
import twitterClient from './core/twitter-client'
import deepseekClient from './core/deepseek-client'
import { BOT_CONFIG } from '@/shared/constants'

// Load environment variables
dotenv.config()

class XBot {
  private isRunning: boolean = false
  private startTime: Date | null = null

  constructor() {
    botLogger.info('XBot initializing...')
  }

  /**
   * Initialize the bot
   */
  async initialize(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Check logger health
      const loggerHealth = checkLoggerHealth()
      if (loggerHealth.status !== 'healthy') {
        errors.push(`Logger health check failed: ${loggerHealth.error}`)
      } else {
        botLogger.info('Logger initialized successfully')
      }

      // Test Twitter API connection
      const twitterTest = await twitterClient.testConnection()
      if (!twitterTest.success) {
        errors.push(`Twitter API connection failed: ${twitterTest.error}`)
      } else {
        botLogger.info('Twitter API connection successful')
      }

      // Test DeepSeek API connection
      const deepseekTest = await deepseekClient.testConnection()
      if (!deepseekTest.success) {
        errors.push(`DeepSeek API connection failed: ${deepseekTest.error}`)
      } else {
        botLogger.info('DeepSeek API connection successful')
      }

      // Check bot configuration
      if (!BOT_CONFIG.ENABLED) {
        botLogger.warn('Bot is disabled in configuration')
      }

      if (errors.length === 0) {
        botLogger.info('XBot initialization completed successfully')
        return { success: true, errors: [] }
      } else {
        botLogger.error('XBot initialization completed with errors', null, { errors })
        return { success: false, errors }
      }
    } catch (error: any) {
      const errorMessage = `Initialization error: ${error.message}`
      botLogger.error(errorMessage, error)
      return { success: false, errors: [errorMessage] }
    }
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      botLogger.warn('Bot is already running')
      return
    }

    const initResult = await this.initialize()
    if (!initResult.success) {
      botLogger.error('Failed to initialize bot', null, { errors: initResult.errors })
      throw new Error('Bot initialization failed')
    }

    this.isRunning = true
    this.startTime = new Date()
    botLogger.info('XBot started successfully', {
      startTime: this.startTime.toISOString(),
      config: {
        username: BOT_CONFIG.USERNAME,
        hashtag: BOT_CONFIG.HASHTAG,
        enabled: BOT_CONFIG.ENABLED
      }
    })
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      botLogger.warn('Bot is not running')
      return
    }

    this.isRunning = false
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0
    botLogger.info('XBot stopped', {
      uptime,
      startTime: this.startTime?.toISOString(),
      stopTime: new Date().toISOString()
    })
  }

  /**
   * Get bot status
   */
  getStatus(): {
    isRunning: boolean
    startTime: string | null
    uptime: number
    twitterStatus: any
    deepseekStatus: any
  } {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0
    
    return {
      isRunning: this.isRunning,
      startTime: this.startTime?.toISOString() || null,
      uptime,
      twitterStatus: twitterClient.getAuthStatus(),
      deepseekStatus: deepseekClient.getConnectionStatus()
    }
  }

  /**
   * Test bot functionality
   */
  async testBot(): Promise<{ success: boolean; results: any }> {
    const results: any = {}

    try {
      // Test Twitter functionality
      try {
        const mentions = await twitterClient.getMentions(5)
        results.twitter = {
          success: true,
          mentionsCount: mentions.length
        }
      } catch (error: any) {
        results.twitter = {
          success: false,
          error: error.message
        }
      }

      // Test DeepSeek functionality
      try {
        const testRequest = {
          systemPrompt: 'You are a helpful assistant.',
          userMessage: 'Hello!',
          context: {
            originalTweet: 'Test tweet',
            userMention: '@testuser',
            hashtags: ['#test'],
            tweetId: '123',
            userId: '456',
            username: 'testuser'
          },
          config: deepseekClient.getConfig()
        }

        const response = await deepseekClient.generateBotResponse(testRequest)
        results.deepseek = {
          success: response.success,
          response: response.response?.substring(0, 100),
          error: response.error
        }
      } catch (error: any) {
        results.deepseek = {
          success: false,
          error: error.message
        }
      }

      const overallSuccess = results.twitter?.success && results.deepseek?.success
      return { success: overallSuccess, results }
    } catch (error: any) {
      botLogger.error('Bot test failed', error)
      return { success: false, results: { error: error.message } }
    }
  }
}

// Create singleton instance
const xbot = new XBot()

// Handle process termination
process.on('SIGINT', async () => {
  botLogger.info('Received SIGINT, shutting down...')
  await xbot.stop()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  botLogger.info('Received SIGTERM, shutting down...')
  await xbot.stop()
  process.exit(0)
})

// Export for testing
export { xbot, XBot }

// If this file is run directly, start the bot
if (require.main === module) {
  (async () => {
    try {
      await xbot.start()
      
      // Run a quick test
      const testResult = await xbot.testBot()
      botLogger.info('Bot test completed', testResult)
      
      // Keep the process running
      botLogger.info('Bot is running. Press Ctrl+C to stop.')
    } catch (error: any) {
      botLogger.error('Failed to start bot', error)
      process.exit(1)
    }
  })()
} 