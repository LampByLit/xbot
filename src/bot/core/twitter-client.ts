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
import { API_ENDPOINTS, HTTP_STATUS } from '../../shared/constants'
import { botLogger } from '../utils/logger'
import { twitterRateLimiter } from '../utils/rate-limiter'
import { getRequiredEnvVar } from '../../shared/utils'
import stateManager from './state-manager'

interface TwitterClientConfig {
  apiKey: string
  apiSecret: string
  accessToken: string
  accessTokenSecret: string
  bearerToken: string
}

class TwitterClient {
  private config: TwitterClientConfig | null = null
  private oauth: OAuth | null = null
  private axiosInstance: AxiosInstance | null = null
  private isAuthenticated: boolean = false

  constructor() {
    // Initialize lazily to avoid environment variable access at import time
  }

  // Check if we can make API calls
  private canMakeApiCall(): boolean {
    if (!stateManager.canMakeApiCall('twitter')) {
      const timeUntilReset = stateManager.getTimeUntilReset('twitter')
      botLogger.warn('Twitter API rate limit reached', { 
        timeUntilReset: Math.ceil(timeUntilReset / 1000 / 60) + ' minutes' 
      })
      return false
    }
    return true
  }

  // Update rate limit info from response headers
  private updateRateLimitInfo(response: AxiosResponse): void {
    const remaining = response.headers['x-rate-limit-remaining']
    const reset = response.headers['x-rate-limit-reset']
    
    if (remaining !== undefined) {
      stateManager.updateApiCallsRemaining('twitter', parseInt(remaining))
    }
    
    if (reset) {
      const resetTime = new Date(parseInt(reset) * 1000).toISOString()
      stateManager.updateRateLimitReset('twitter', resetTime)
    }
  }

  private getConfig(): TwitterClientConfig {
    if (!this.config) {
      this.config = {
        apiKey: getRequiredEnvVar('X_API_KEY'),
        apiSecret: getRequiredEnvVar('X_API_KEY_SECRET'),
        accessToken: getRequiredEnvVar('X_ACCESS_TOKEN'),
        accessTokenSecret: getRequiredEnvVar('X_ACCESS_TOKEN_SECRET'),
        bearerToken: getRequiredEnvVar('X_BEARER_TOKEN')
      }
    }
    return this.config
  }

  private getOAuth(): OAuth {
    if (!this.oauth) {
      const config = this.getConfig()
      this.oauth = new OAuth({
        consumer: {
          key: config.apiKey,
          secret: config.apiSecret
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
        }
      })
    }
    return this.oauth
  }

  private getAxiosInstance(): AxiosInstance {
    if (!this.axiosInstance) {
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
            const config_obj = this.getConfig()
            
            // Create OAuth request data
            const request_data = {
              url: config.url,
              method: config.method.toUpperCase()
            }

            // Add query parameters to OAuth signature if they exist
            if (config.params) {
              request_data.url += '?' + new URLSearchParams(config.params).toString()
            }

            const token = {
              key: config_obj.accessToken,
              secret: config_obj.accessTokenSecret
            }

            // Generate OAuth signature
            const oauth = this.getOAuth()
            const authHeader = oauth.toHeader(oauth.authorize(request_data, token))
            
            // Apply OAuth headers
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
    return this.axiosInstance
  }

  /**
   * Test authentication and API connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limits first
      if (!this.canMakeApiCall()) {
        return { success: false, error: 'Rate limit exceeded' }
      }

      // Use cached user ID if available, otherwise get it
      const cachedUserId = stateManager.getUserId()
      if (cachedUserId) {
        botLogger.info('Using cached user ID', { userId: cachedUserId })
        this.isAuthenticated = true
        return { success: true }
      }

      // Get user ID from API
      botLogger.apiRequest('twitter', 'users/me')
      
      const response = await this.getAxiosInstance().get(`${API_ENDPOINTS.TWITTER.BASE_URL}/users/me`)
      
      // Update rate limit info
      this.updateRateLimitInfo(response)
      
      botLogger.apiResponse('twitter', 'users/me', response.status)
      
      if (response.status === HTTP_STATUS.OK) {
        this.isAuthenticated = true
        
        // Cache the user ID
        const userId = response.data.data.id
        stateManager.setUserId(userId)
        
        botLogger.info('Twitter API connection test successful', { userId })
        return { success: true }
      } else {
        return { success: false, error: `HTTP ${response.status}` }
      }
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
      botLogger.apiRequest('twitter', 'tweets', {
        text: request.status.substring(0, 50) + '...',
        inReplyTo: request.in_reply_to_status_id
      })

      const config = this.getConfig()
      const response: AxiosResponse<any> = await axios.post(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/tweets`,
        {
          text: request.status,
          ...(request.in_reply_to_status_id && { reply: { in_reply_to_tweet_id: request.in_reply_to_status_id } })
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'XBot/1.0.0',
            ...this.getOAuth().toHeader(this.getOAuth().authorize({
              url: `${API_ENDPOINTS.TWITTER.BASE_URL}/tweets`,
              method: 'POST'
            }, {
              key: config.accessToken,
              secret: config.accessTokenSecret
            }))
          }
        }
      )

      botLogger.info('Tweet posted successfully', {
        tweetId: response.data.data.id,
        text: response.data.data.text.substring(0, 100)
      })

      // Convert v2 response to v1.1 format for compatibility
      return {
        id: parseInt(response.data.data.id),
        id_str: response.data.data.id,
        created_at: response.data.data.created_at,
        text: response.data.data.text,
        truncated: false,
        entities: {
          hashtags: [],
          user_mentions: []
        },
        source: 'XBot',
        user: response.data.includes?.users?.[0] || {},
        geo: null,
        coordinates: null,
        place: null,
        contributors: null,
        is_quote_status: false,
        retweet_count: 0,
        favorite_count: 0,
        favorited: false,
        retweeted: false,
        lang: 'en'
      }
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
    // Check rate limits first
    if (!this.canMakeApiCall()) {
      throw new Error('Rate limit exceeded')
    }

    await twitterRateLimiter.waitForSearch()

    try {
      // Use cached user ID if available
      let userId = stateManager.getUserId()
      if (!userId) {
        botLogger.info('No cached user ID, fetching from API')
        const userResponse = await this.getAxiosInstance().get(
          `${API_ENDPOINTS.TWITTER.BASE_URL}/users/me`
        )
        userId = userResponse.data.data.id
        stateManager.setUserId(userId)
      }

      // Use persistent lastMentionId if no sinceId provided
      const actualSinceId = sinceId || stateManager.getLastMentionId()
      
      const params: any = { 
        'max_results': count,
        'tweet.fields': 'created_at,author_id,text',
        'user.fields': 'username,name',
        'expansions': 'author_id'
      }
      if (actualSinceId) params.since_id = actualSinceId

      botLogger.apiRequest('twitter', `users/${userId}/mentions`, { 
        count, 
        sinceId: actualSinceId, 
        userId,
        usingCachedUserId: !!stateManager.getUserId()
      })

      // Use the configured axios instance with OAuth interceptors
      const response: AxiosResponse<any> = await this.getAxiosInstance().get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/users/${userId}/mentions`,
        { params }
      )

      // Update rate limit info
      this.updateRateLimitInfo(response)

      const mentions = response.data.data || []
      
      // Update lastMentionId if we got new mentions
      if (mentions.length > 0) {
        const latestMentionId = mentions[0].id
        stateManager.setLastMentionId(latestMentionId)
      }

      botLogger.info('Mentions retrieved', {
        count: mentions.length,
        sinceId: actualSinceId,
        userId,
        usingCachedUserId: !!stateManager.getUserId()
      })

      // Convert v2 response to v1.1 format for compatibility
      return mentions.map((tweet: any) => ({
        id_str: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        user: response.data.includes?.users?.find((u: any) => u.id === tweet.author_id) || {}
      }))
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

      const response: AxiosResponse<TwitterSearchResponse> = await this.getAxiosInstance().get(
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

      // Use Bearer token for user lookup (more reliable than OAuth for this endpoint)
      const config = this.getConfig()
      const response: AxiosResponse<TwitterUser> = await axios.get(
        `${API_ENDPOINTS.TWITTER.BASE_URL}/users/show.json`,
        { 
          params: { screen_name: username },
          headers: {
            'Authorization': `Bearer ${config.bearerToken}`,
            'User-Agent': 'XBot/1.0.0'
          }
        }
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

      const response: AxiosResponse<TwitterTweet> = await this.getAxiosInstance().get(
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

      const response: AxiosResponse<TwitterTweet[]> = await this.getAxiosInstance().get(
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
      const response: AxiosResponse<Record<string, TwitterRateLimit>> = await this.getAxiosInstance().get(
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
      
      // Log the full error for debugging
      botLogger.error('Twitter API Error Details', error, {
        status,
        data,
        url: error.config?.url,
        method: error.config?.method
      })
      
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
      const errorMessage = data?.errors?.[0]?.message || data?.error || data?.detail || 'Unknown Twitter API error'
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
    const config = this.config || { apiKey: '', apiSecret: '', accessToken: '', accessTokenSecret: '', bearerToken: '' }
    return {
      authenticated: this.isAuthenticated,
      config: {
        apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : '',
        apiSecret: config.apiSecret ? '***' + config.apiSecret.slice(-4) : '',
        accessToken: config.accessToken ? '***' + config.accessToken.slice(-4) : '',
        accessTokenSecret: config.accessTokenSecret ? '***' + config.accessTokenSecret.slice(-4) : '',
        bearerToken: config.bearerToken ? '***' + config.bearerToken.slice(-4) : ''
      }
    }
  }
}

// Create singleton instance
const twitterClient = new TwitterClient()

export default twitterClient 