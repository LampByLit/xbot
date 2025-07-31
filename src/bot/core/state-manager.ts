import fs from 'fs'
import path from 'path'
import { PATHS } from '../../shared/constants'
import { botLogger } from '../utils/logger'

interface BotState {
  lastMentionId: string | null
  userId: string | null
  lastPollTime: string | null
  apiCallsRemaining: {
    twitter: number
    deepseek: number
  }
  rateLimitReset: {
    twitter: string | null
    deepseek: string | null
  }
  lastUpdated: string
}

class StateManager {
  private state: BotState
  private statePath: string

  constructor() {
    this.statePath = path.join(PATHS.DATA_DIR, 'bot-state.json')
    this.state = this.loadState()
  }

  private loadState(): BotState {
    try {
      if (fs.existsSync(this.statePath)) {
        const data = fs.readFileSync(this.statePath, 'utf8')
        const parsed = JSON.parse(data)
        botLogger.info('Bot state loaded from file', { lastMentionId: parsed.lastMentionId })
        return parsed
      }
    } catch (error) {
      botLogger.error('Error loading bot state', error as Error)
    }

    // Default state
    return {
      lastMentionId: null,
      userId: null,
      lastPollTime: null,
      apiCallsRemaining: {
        twitter: 1500,
        deepseek: 100
      },
      rateLimitReset: {
        twitter: null,
        deepseek: null
      },
      lastUpdated: new Date().toISOString()
    }
  }

  private saveState(): void {
    try {
      this.state.lastUpdated = new Date().toISOString()
      const dataDir = path.dirname(this.statePath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2))
    } catch (error) {
      botLogger.error('Error saving bot state', error as Error)
    }
  }

  // Getters
  getLastMentionId(): string | null {
    return this.state.lastMentionId
  }

  getUserId(): string | null {
    return this.state.userId
  }

  getLastPollTime(): string | null {
    return this.state.lastPollTime
  }

  getApiCallsRemaining(service: 'twitter' | 'deepseek'): number {
    return this.state.apiCallsRemaining[service]
  }

  getRateLimitReset(service: 'twitter' | 'deepseek'): string | null {
    return this.state.rateLimitReset[service]
  }

  // Setters
  setLastMentionId(mentionId: string): void {
    this.state.lastMentionId = mentionId
    this.saveState()
    botLogger.info('Updated last mention ID', { mentionId })
  }

  setUserId(userId: string): void {
    this.state.userId = userId
    this.saveState()
    botLogger.info('Updated user ID', { userId })
  }

  setLastPollTime(): void {
    this.state.lastPollTime = new Date().toISOString()
    this.saveState()
  }

  updateApiCallsRemaining(service: 'twitter' | 'deepseek', remaining: number): void {
    this.state.apiCallsRemaining[service] = remaining
    this.saveState()
  }

  updateRateLimitReset(service: 'twitter' | 'deepseek', resetTime: string): void {
    this.state.rateLimitReset[service] = resetTime
    this.saveState()
  }

  // Rate limit checking
  canMakeApiCall(service: 'twitter' | 'deepseek'): boolean {
    const remaining = this.getApiCallsRemaining(service)
    const resetTime = this.getRateLimitReset(service)
    
    if (remaining <= 0) {
      if (resetTime) {
        const resetDate = new Date(resetTime)
        const now = new Date()
        if (now >= resetDate) {
          // Reset time has passed, reset the counter
          this.updateApiCallsRemaining(service, service === 'twitter' ? 1500 : 100)
          return true
        }
      }
      return false
    }
    
    return true
  }

  // Get time until next reset
  getTimeUntilReset(service: 'twitter' | 'deepseek'): number {
    const resetTime = this.getRateLimitReset(service)
    if (!resetTime) return 0
    
    const resetDate = new Date(resetTime)
    const now = new Date()
    return Math.max(0, resetDate.getTime() - now.getTime())
  }

  // Get current state summary
  getStateSummary(): {
    lastMentionId: string | null
    userId: string | null
    lastPollTime: string | null
    twitterCallsRemaining: number
    deepseekCallsRemaining: number
    twitterResetTime: string | null
    deepseekResetTime: string | null
  } {
    return {
      lastMentionId: this.state.lastMentionId,
      userId: this.state.userId,
      lastPollTime: this.state.lastPollTime,
      twitterCallsRemaining: this.state.apiCallsRemaining.twitter,
      deepseekCallsRemaining: this.state.apiCallsRemaining.deepseek,
      twitterResetTime: this.state.rateLimitReset.twitter,
      deepseekResetTime: this.state.rateLimitReset.deepseek
    }
  }
}

// Create singleton instance
const stateManager = new StateManager()
export default stateManager 