// DeepSeek API Types

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekChatRequest {
  model: string
  messages: DeepSeekMessage[]
  temperature?: number
  top_p?: number
  n?: number
  stream?: boolean
  stop?: string | string[]
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  logit_bias?: Record<string, number>
  user?: string
}

export interface DeepSeekChoice {
  index: number
  message: DeepSeekMessage
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null
}

export interface DeepSeekUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface DeepSeekChatResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: DeepSeekChoice[]
  usage: DeepSeekUsage
}

export interface DeepSeekError {
  error: {
    message: string
    type: string
    param?: string
    code?: string
  }
}

// DeepSeek API Configuration
export interface DeepSeekConfig {
  apiKey: string
  apiUrl: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
}

// Bot-specific DeepSeek types
export interface BotSystemPrompt {
  id: string
  name: string
  content: string
  enabled: boolean
  priority: number
}

export interface BotResponseContext {
  originalTweet: string
  userMention: string
  hashtags: string[]
  tweetId: string
  userId: string
  username: string
}

export interface BotResponseRequest {
  systemPrompt: string
  userMessage: string
  context: BotResponseContext
  config: DeepSeekConfig
}

export interface BotResponseResult {
  success: boolean
  response?: string
  error?: string
  usage?: DeepSeekUsage
  model: string
  timestamp: string
}

// DeepSeek Rate Limiting
export interface DeepSeekRateLimit {
  requestsPerMinute: number
  tokensPerMinute: number
  currentRequests: number
  currentTokens: number
  resetTime: number
}

// DeepSeek Error Types
export interface DeepSeekApiError {
  statusCode: number
  message: string
  type: 'rate_limit' | 'authentication' | 'quota_exceeded' | 'invalid_request' | 'server_error'
  retryAfter?: number
} 