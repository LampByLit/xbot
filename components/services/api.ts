// API service layer for communicating with backend

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BotConfig {
  enabled: boolean
  username: string
  hashtag: string
  maxResponseLength: number
  responseDelay: number
  whitelistEnabled: boolean
  whitelistMode: 'allow' | 'deny'
  maxRepliesPerHour: number
  maxRepliesPerDay: number
  logLevel: 'error' | 'warn' | 'info' | 'debug'
  logRetentionDays: number
  autoReply: boolean
  includeContext: boolean
  includeHashtags: boolean
}

export interface WhitelistEntry {
  username: string
  addedAt: string
  addedBy?: string
  reason?: string
  enabled: boolean
}

export interface Whitelist {
  entries: WhitelistEntry[]
  lastUpdated: string
}

export interface SystemPromptModule {
  id: string
  name: string
  description: string
  prompt: string
  enabled: boolean
  priority: number
  category: 'core' | 'personality' | 'functionality' | 'custom'
  tags?: string[]
  version?: string
}

export interface BotStatus {
  isRunning: boolean
  startTime: string | null
  uptime: number
  twitterStatus: any
  deepseekStatus: any
  configStatus: any
}

class ApiService {
  private baseUrl = '/api'

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return data
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      }
    }
  }

  // Configuration API
  async getConfig(): Promise<ApiResponse<{ config: BotConfig; health: any }>> {
    return this.request('/config')
  }

  async updateConfig(config: Partial<BotConfig>): Promise<ApiResponse> {
    return this.request('/config', {
      method: 'POST',
      body: JSON.stringify({ config }),
    })
  }

  // Whitelist API
  async getWhitelist(): Promise<ApiResponse<Whitelist>> {
    return this.request('/whitelist')
  }

  async addToWhitelist(username: string, addedBy?: string, reason?: string): Promise<ApiResponse> {
    return this.request('/whitelist', {
      method: 'POST',
      body: JSON.stringify({ username, addedBy, reason }),
    })
  }

  async removeFromWhitelist(username: string): Promise<ApiResponse> {
    return this.request(`/whitelist?username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    })
  }

  // Prompts API
  async getPrompts(): Promise<ApiResponse<{
    allPrompts: SystemPromptModule[]
    activePrompts: SystemPromptModule[]
    combinedPrompt: string
    statistics: any
  }>> {
    return this.request('/prompts')
  }

  async togglePrompt(id: string, enabled: boolean): Promise<ApiResponse> {
    return this.request('/prompts', {
      method: 'POST',
      body: JSON.stringify({
        action: 'toggle',
        data: { id, enabled },
      }),
    })
  }

  async updatePromptPriority(id: string, priority: number): Promise<ApiResponse> {
    return this.request('/prompts', {
      method: 'POST',
      body: JSON.stringify({
        action: 'updatePriority',
        data: { id, priority },
      }),
    })
  }

  async addCustomPrompt(prompt: SystemPromptModule): Promise<ApiResponse> {
    return this.request('/prompts', {
      method: 'POST',
      body: JSON.stringify({
        action: 'addCustom',
        data: prompt,
      }),
    })
  }

  // Status API
  async getStatus(): Promise<ApiResponse<BotStatus>> {
    return this.request('/status')
  }
}

export const apiService = new ApiService() 