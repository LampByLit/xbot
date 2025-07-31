import axios, { AxiosInstance, AxiosResponse } from 'axios'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import { 
  TwitterPostRequest, 
  TwitterPostResponse, 
  TwitterSearchRequest, 
  TwitterSearchResponse, 
  TwitterTweet, 
  TwitterUser, 
  TwitterMention,
  TwitterStreamData,
  TwitterError,
  TwitterRateLimit
} from '../types/twitter-types'
import { API_ENDPOINTS, HTTP_STATUS } from '@/shared/constants'
import { botLogger } from '../utils/logger'
import { twitterRateLimiter } from '../utils/rate-limiter'
import { getRequiredEnvVar } from '@/shared/utils'

interface TwitterClientConfig {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
  bearerToken: string
}

class TwitterClient {
  private config: TwitterClientConfig
  private oauth: OAuth
  private axiosInstance: AxiosInstance
  private isAuthenticated: boolean = false

  constructor() {
    this.config = {
      apiKey: getRequiredEnvVar('TWITTER_API_KEY'),
      apiSecret: getRequiredEnvVar('TWITTER_API_SECRET'),
      accessToken: getRequiredEnvVar('TWITTER_ACCESS_TOKEN'),
      accessTokenSecret: getRequiredEnvVar('TWITTER_ACCESS_TOKEN_SECRET'),
      bearerToken: getRequiredEnvVar('TWITTER_BEARER_TOKEN')
    }

    this.oauth = new OAuth({
      consumer: {
        key: this.config.apiKey,
        secret: this.config.apiSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
      }
    })

    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'XBot/1.0.0'
      }
    })

    // Add request interceptor for OAuth
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (config.url && config.method && !config.url.includes('oauth')) {
          const request_data = {
            url: config.url,
            method: config.method.toUpperCase()
          }

          const token = {
            key: this.config.accessToken,
            secret: this.config.accessTokenSecret
          }

          const authHeader = this.oauth.toHeader(this.oauth.authorize(request_data, token))
          if (config.headers) {
            Object.assign(config.headers, authHeader)
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        botLogger.apiResponse('twitter', response.config.url || '', response.status, {
          method: response.config.method,
          dataSize: JSON.stringify(response.data).length
        })
        return response
      },
      (error) => {
        botLogger.error('Twitter API Error', error, {
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
   * Test authentication and API connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.getUserInfo('recapitul8r')
      this.isAuthenticated = true
      botLogger.info('Twitter API connection test successful')
      return { success: true }
    } catch (error: any) {
      this.isAuthenticated = false
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.message
      botLogger.error('Twitter API connection test failed', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(request: TwitterPostRequest): Promise<TwitterPostResponse> {
    await twitterRateLimiter.waitForPost()

    try {
      botLogger.apiRequest('twitter', 'statuses/update', {
        text: request.status.substring(0, 50) + '...',
        inReplyTo: request.in_reply_to_status_id
      })

      const response: AxiosResponse<TwitterPostResponse> = await this.axiosInstance.post(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/statuses/update.json`,
        request
      )

      botLogger.info('Tweet posted successfully', {
        tweetId: response.data.id_str,
        text: response.data.text.substring(0, 100)
      })

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Reply to a tweet
   */
  async replyToTweet(tweetId: string, text: string): Promise<TwitterPostResponse> {
    const request: TwitterPostRequest = {
      status: text,
      in_reply_to_status_id: tweetId,
      auto_populate_reply_metadata: true
    }

    return this.postTweet(request)
  }

  /**
   * Get mentions timeline
   */
  async getMentions(count: number = 100, sinceId?: string): Promise<TwitterMention[]> {
    await twitterRateLimiter.waitForSearch()

    try {
      const params: any = { count }
      if (sinceId) params.since_id = sinceId

      botLogger.apiRequest('twitter', 'statuses/mentions_timeline', { count, sinceId })

      const response: AxiosResponse<TwitterMention[]> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/statuses/mentions_timeline.json`,
        { params }
      )

      botLogger.info('Mentions retrieved', {
        count: response.data.length,
        sinceId
      })

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Search tweets
   */
  async searchTweets(request: TwitterSearchRequest): Promise<TwitterSearchResponse> {
    await twitterRateLimiter.waitForSearch()

    try {
      botLogger.apiRequest('twitter', 'search/tweets', {
        query: request.q,
        count: request.count
      })

      const response: AxiosResponse<TwitterSearchResponse> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/search/tweets.json`,
        { params: request }
      )

      botLogger.info('Tweets search completed', {
        query: request.q,
        resultCount: response.data.statuses.length
      })

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(username: string): Promise<TwitterUser> {
    try {
      botLogger.apiRequest('twitter', 'users/show', { username })

      const response: AxiosResponse<TwitterUser> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/users/show.json`,
        { params: { screen_name: username } }
      )

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Get tweet by ID
   */
  async getTweet(tweetId: string): Promise<TwitterTweet> {
    try {
      botLogger.apiRequest('twitter', 'statuses/show', { tweetId })

      const response: AxiosResponse<TwitterTweet> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/statuses/show.json`,
        { params: { id: tweetId } }
      )

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Get user timeline
   */
  async getUserTimeline(username: string, count: number = 20): Promise<TwitterTweet[]> {
    try {
      botLogger.apiRequest('twitter', 'statuses/user_timeline', { username, count })

      const response: AxiosResponse<TwitterTweet[]> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/statuses/user_timeline.json`,
        { params: { screen_name: username, count } }
      )

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<Record<string, TwitterRateLimit>> {
    try {
      const response: AxiosResponse<Record<string, TwitterRateLimit>> = await this.axiosInstance.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/application/rate_limit_status.json`
      )

      return response.data
    } catch (error: any) {
      const twitterError = this.handleTwitterError(error)
      throw twitterError
    }
  }

  /**
   * Handle Twitter API errors
   */
  private handleTwitterError(error: any): TwitterError {
    if (error.response) {
      const { status, data } = error.response
      
      // Handle rate limiting
      if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        const resetTime = error.response.headers['x-rate-limit-reset']
        botLogger.rateLimit('twitter', 0, new Date(parseInt(resetTime) * 1000).toISOString())
        return {
          code: status,
          message: 'Rate limit exceeded'
        }
      }

      // Handle authentication errors
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        this.isAuthenticated = false
        return {
          code: status,
          message: 'Authentication failed'
        }
      }

      // Handle other API errors
      const errorMessage = data?.errors?.[0]?.message || data?.error || 'Unknown Twitter API error'
      return {
        code: status,
        message: errorMessage
      }
    }

    // Handle network errors
    return {
      code: 0,
      message: error.message || 'Network error'
    }
  }

  /**
   * Check if client is authenticated
   */
  isConnected(): boolean {
    return this.isAuthenticated
  }

  /**
   * Get authentication status
   */
  getAuthStatus(): { authenticated: boolean; config: Partial<TwitterClientConfig> } {
    return {
      authenticated: this.isAuthenticated,
      config: {
        apiKey: this.config.apiKey ? '***' : undefined,
        bearerToken: this.config.bearerToken ? '***' : undefined
      }
    }
  }
}

// Create singleton instance
const twitterClient = new TwitterClient()

export default twitterClient 