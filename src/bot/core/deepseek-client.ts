import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  DeepSeekChatRequest, 
  DeepSeekChatResponse, 
  DeepSeekError, 
  DeepSeekConfig,
  BotResponseRequest,
  BotResponseResult,
  BotResponseContext
} from '../types/deepseek-types'
import { API_ENDPOINTS, HTTP_STATUS } from '@/shared/constants'
import { botLogger } from '../utils/logger'
import { deepseekRateLimiter } from '../utils/rate-limiter'
import { getRequiredEnvVar } from '@/shared/utils'

interface DeepSeekClientConfig {
  apiKey: string
  apiUrl: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
}

class DeepSeekClient {
  private config: DeepSeekConfig
  private axiosInstance: AxiosInstance
  private isConnected: boolean = false

  constructor() {
    this.config = {
      apiKey: getRequiredEnvVar('DEEPSEEK_API_KEY'),
      apiUrl: getRequiredEnvVar('DEEPSEEK_API_URL'),
      model: 'deepseek-chat',
      maxTokens: 1000,
      temperature: 0.7,
      topP: 0.9,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0
    }

    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 60000, // 60 seconds for AI responses
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'XBot/1.0.0'
      }
    })

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        botLogger.apiResponse('deepseek', response.config.url || '', response.status, {
          method: response.config.method,
          model: response.data?.model,
          usage: response.data?.usage
        })
        return response
      },
      (error) => {
        botLogger.error('DeepSeek API Error', error, {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        })
        return Promise.reject(error)
      }
    )
  }

  /**
   * Test connection to DeepSeek API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testRequest: DeepSeekChatRequest = {
        model: this.config.model,
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        max_tokens: 10
      }

      await this.makeRequest(testRequest)
      this.isConnected = true
      botLogger.info('DeepSeek API connection test successful')
      return { success: true }
    } catch (error: any) {
      this.isConnected = false
      const errorMessage = error.response?.data?.error?.message || error.message
      botLogger.error('DeepSeek API connection test failed', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Generate response for bot
   */
  async generateBotResponse(request: BotResponseRequest): Promise<BotResponseResult> {
    const startTime = Date.now()

    try {
      // Estimate token usage for rate limiting
      const estimatedTokens = this.estimateTokenUsage(request.systemPrompt, request.userMessage)
      await deepseekRateLimiter.waitForTokens(estimatedTokens)
      await deepseekRateLimiter.waitForRequest()

      botLogger.apiRequest('deepseek', 'chat/completions', {
        model: request.config.model,
        estimatedTokens,
        contextLength: request.userMessage.length
      })

      const chatRequest: DeepSeekChatRequest = {
        model: request.config.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: this.formatUserMessage(request.userMessage, request.context) }
        ],
        max_tokens: request.config.maxTokens,
        temperature: request.config.temperature,
        top_p: request.config.topP,
        presence_penalty: request.config.presencePenalty,
        frequency_penalty: request.config.frequencyPenalty
      }

      const response = await this.makeRequest(chatRequest)
      const processingTime = Date.now() - startTime

      const result: BotResponseResult = {
        success: true,
        response: response.choices[0]?.message?.content,
        usage: response.usage,
        model: response.model,
        timestamp: new Date().toISOString()
      }

      botLogger.info('DeepSeek response generated successfully', {
        model: response.model,
        tokensUsed: response.usage?.total_tokens,
        processingTime,
        responseLength: result.response?.length
      })

      return result
    } catch (error: any) {
      const processingTime = Date.now() - startTime
      const deepseekError = this.handleDeepSeekError(error)

      const result: BotResponseResult = {
        success: false,
        error: deepseekError.error?.message || 'Unknown error',
        model: request.config.model,
        timestamp: new Date().toISOString()
      }

      botLogger.error('DeepSeek response generation failed', error, {
        processingTime,
        error: deepseekError.error?.message || 'Unknown error'
      })

      return result
    }
  }

  /**
   * Make a chat completion request
   */
  private async makeRequest(request: DeepSeekChatRequest): Promise<DeepSeekChatResponse> {
    try {
      const response: AxiosResponse<DeepSeekChatResponse> = await this.axiosInstance.post(
        API_ENDPOINTS.DEEPSEEK.CHAT_COMPLETIONS,
        request
      )

      return response.data
    } catch (error: any) {
      const deepseekError = this.handleDeepSeekError(error)
      throw deepseekError
    }
  }

  /**
   * Format user message with context
   */
  private formatUserMessage(message: string, context: BotResponseContext): string {
    const contextInfo = `
Tweet ID: ${context.tweetId}
User: @${context.username}
Original Tweet: ${context.originalTweet}
Hashtags: ${context.hashtags.join(', ')}
User Mention: ${context.userMention}

User's message: ${message}
`.trim()

    return contextInfo
  }

  /**
   * Estimate token usage for rate limiting
   */
  private estimateTokenUsage(systemPrompt: string, userMessage: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    const systemTokens = Math.ceil(systemPrompt.length / 4)
    const userTokens = Math.ceil(userMessage.length / 4)
    const responseTokens = 200 // Estimated response length
    
    return systemTokens + userTokens + responseTokens
  }

  /**
   * Handle DeepSeek API errors
   */
  private handleDeepSeekError(error: any): DeepSeekError {
    if (error.response) {
      const { status, data } = error.response
      
      // Handle rate limiting
      if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        const retryAfter = error.response.headers['retry-after']
        botLogger.rateLimit('deepseek', 0, new Date(Date.now() + (parseInt(retryAfter) * 1000)).toISOString())
        return {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit',
            code: 'rate_limit_exceeded'
          }
        }
      }

      // Handle authentication errors
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        this.isConnected = false
        return {
          error: {
            message: 'Authentication failed',
            type: 'authentication',
            code: 'invalid_api_key'
          }
        }
      }

      // Handle quota exceeded
      if (status === HTTP_STATUS.FORBIDDEN && data?.error?.code === 'quota_exceeded') {
        return {
          error: {
            message: 'API quota exceeded',
            type: 'quota_exceeded',
            code: 'quota_exceeded'
          }
        }
      }

      // Handle other API errors
      const errorMessage = data?.error?.message || 'Unknown DeepSeek API error'
      return {
        error: {
          message: errorMessage,
          type: 'api_error',
          code: data?.error?.code || 'unknown_error'
        }
      }
    }

    // Handle network errors
    return {
      error: {
        message: error.message || 'Network error',
        type: 'network_error',
        code: 'network_error'
      }
    }
  }

  /**
   * Update client configuration
   */
  updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig }
    botLogger.info('DeepSeek client configuration updated', { newConfig })
  }

  /**
   * Get current configuration
   */
  getConfig(): DeepSeekConfig {
    return { ...this.config }
  }

  /**
   * Check if client is connected
   */
  getConnectionStatus(): { connected: boolean; config: Partial<DeepSeekClientConfig> } {
    return {
      connected: this.isConnected,
      config: {
        apiUrl: this.config.apiUrl,
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      }
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{ requests: any; tokens: any }> {
    return {
      requests: deepseekRateLimiter.getRequestStatus(),
      tokens: deepseekRateLimiter.getTokenStatus()
    }
  }
}

// Create singleton instance
const deepseekClient = new DeepSeekClient()

export default deepseekClient 