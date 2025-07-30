import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { PATHS } from '@/shared/constants'
import { botLogger } from '../utils/logger'
import { safeJsonParse, safeJsonStringify } from '@/shared/utils'

// Configuration schemas
const SystemPromptModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  prompt: z.string(),
  enabled: z.boolean(),
  priority: z.number().min(1).max(10)
})

const WhitelistEntrySchema = z.object({
  username: z.string(),
  addedAt: z.string(),
  addedBy: z.string().optional(),
  reason: z.string().optional(),
  enabled: z.boolean()
})

const BotConfigSchema = z.object({
  // Core bot settings
  enabled: z.boolean(),
  username: z.string(),
  hashtag: z.string(),
  
  // Response settings
  maxResponseLength: z.number().min(1).max(280),
  responseDelay: z.number().min(0).max(60000), // milliseconds
  
  // Whitelist settings
  whitelistEnabled: z.boolean(),
  whitelistMode: z.enum(['allow', 'deny']), // allow = only whitelisted users, deny = block whitelisted users
  
  // System prompts
  systemPrompts: z.array(SystemPromptModuleSchema),
  defaultSystemPrompt: z.string(),
  
  // Rate limiting
  maxRepliesPerHour: z.number().min(1).max(100),
  maxRepliesPerDay: z.number().min(1).max(1000),
  
  // Logging
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  logRetentionDays: z.number().min(1).max(365),
  
  // Advanced settings
  autoReply: z.boolean(),
  includeContext: z.boolean(),
  includeHashtags: z.boolean(),
  
  // Timestamps
  lastUpdated: z.string(),
  created: z.string()
})

const WhitelistSchema = z.object({
  entries: z.array(WhitelistEntrySchema),
  lastUpdated: z.string()
})

// Type definitions
export type SystemPromptModule = z.infer<typeof SystemPromptModuleSchema>
export type WhitelistEntry = z.infer<typeof WhitelistEntrySchema>
export type BotConfig = z.infer<typeof BotConfigSchema>
export type Whitelist = z.infer<typeof WhitelistSchema>

// Default configuration
const defaultSystemPrompts: SystemPromptModule[] = [
  {
    id: 'greeting',
    name: 'Greeting Module',
    description: 'Handles friendly greetings and introductions',
    prompt: 'You are a friendly Twitter bot. Respond warmly to greetings and be helpful.',
    enabled: true,
    priority: 1
  },
  {
    id: 'help',
    name: 'Help Module',
    description: 'Provides help and information about the bot',
    prompt: 'You can help users understand what you do and how to interact with you.',
    enabled: true,
    priority: 2
  },
  {
    id: 'conversation',
    name: 'Conversation Module',
    description: 'Handles general conversation and questions',
    prompt: 'Engage in natural conversation. Be helpful, informative, and friendly.',
    enabled: true,
    priority: 3
  }
]

const defaultConfig: BotConfig = {
  enabled: true,
  username: 'recapitul8r',
  hashtag: 'hey',
  maxResponseLength: 280,
  responseDelay: 1000,
  whitelistEnabled: false,
  whitelistMode: 'allow',
  systemPrompts: defaultSystemPrompts,
  defaultSystemPrompt: 'You are a helpful Twitter bot. Be friendly and engaging.',
  maxRepliesPerHour: 50,
  maxRepliesPerDay: 500,
  logLevel: 'info',
  logRetentionDays: 7,
  autoReply: true,
  includeContext: true,
  includeHashtags: true,
  lastUpdated: new Date().toISOString(),
  created: new Date().toISOString()
}

class BotConfigManager {
  private config: BotConfig
  private whitelist: Whitelist
  private configPath: string
  private whitelistPath: string
  private watchers: Set<(config: BotConfig) => void> = new Set()

  constructor() {
    this.configPath = PATHS.CONFIG_FILE
    this.whitelistPath = PATHS.WHITELIST_FILE
    this.config = defaultConfig
    this.whitelist = { entries: [], lastUpdated: new Date().toISOString() }
    
    this.loadConfig()
    this.loadWhitelist()
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8')
        const parsed = safeJsonParse(data)
        
        if (parsed.success) {
          const validated = BotConfigSchema.safeParse(parsed.data)
          if (validated.success) {
            this.config = validated.data
            botLogger.info('Configuration loaded successfully', {
              configPath: this.configPath,
              enabled: this.config.enabled,
              username: this.config.username
            })
          } else {
            botLogger.error('Configuration validation failed', null, {
              errors: validated.error.errors
            })
            this.createDefaultConfig()
          }
        } else {
          botLogger.error('Failed to parse configuration file', null, {
            error: parsed.error
          })
          this.createDefaultConfig()
        }
      } else {
        this.createDefaultConfig()
      }
    } catch (error: any) {
      botLogger.error('Error loading configuration', error)
      this.createDefaultConfig()
    }
  }

  /**
   * Create and save default configuration
   */
  private createDefaultConfig(): void {
    botLogger.info('Creating default configuration')
    this.config = defaultConfig
    this.saveConfig()
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.configPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      this.config.lastUpdated = new Date().toISOString()
      const data = safeJsonStringify(this.config, 2)
      
      if (data.success) {
        fs.writeFileSync(this.configPath, data.data)
        botLogger.info('Configuration saved successfully')
        
        // Notify watchers
        this.watchers.forEach(watcher => watcher(this.config))
      } else {
        botLogger.error('Failed to stringify configuration', null, {
          error: data.error
        })
      }
    } catch (error: any) {
      botLogger.error('Error saving configuration', error)
    }
  }

  /**
   * Load whitelist from file
   */
  private loadWhitelist(): void {
    try {
      if (fs.existsSync(this.whitelistPath)) {
        const data = fs.readFileSync(this.whitelistPath, 'utf8')
        const parsed = safeJsonParse(data)
        
        if (parsed.success) {
          const validated = WhitelistSchema.safeParse(parsed.data)
          if (validated.success) {
            this.whitelist = validated.data
            botLogger.info('Whitelist loaded successfully', {
              entriesCount: this.whitelist.entries.length
            })
          } else {
            botLogger.error('Whitelist validation failed', null, {
              errors: validated.error.errors
            })
            this.createDefaultWhitelist()
          }
        } else {
          botLogger.error('Failed to parse whitelist file', null, {
            error: parsed.error
          })
          this.createDefaultWhitelist()
        }
      } else {
        this.createDefaultWhitelist()
      }
    } catch (error: any) {
      botLogger.error('Error loading whitelist', error)
      this.createDefaultWhitelist()
    }
  }

  /**
   * Create and save default whitelist
   */
  private createDefaultWhitelist(): void {
    botLogger.info('Creating default whitelist')
    this.whitelist = { entries: [], lastUpdated: new Date().toISOString() }
    this.saveWhitelist()
  }

  /**
   * Save whitelist to file
   */
  private saveWhitelist(): void {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.whitelistPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      this.whitelist.lastUpdated = new Date().toISOString()
      const data = safeJsonStringify(this.whitelist, 2)
      
      if (data.success) {
        fs.writeFileSync(this.whitelistPath, data.data)
        botLogger.info('Whitelist saved successfully')
      } else {
        botLogger.error('Failed to stringify whitelist', null, {
          error: data.error
        })
      }
    } catch (error: any) {
      botLogger.error('Error saving whitelist', error)
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BotConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<BotConfig>): { success: boolean; errors?: string[] } {
    try {
      const newConfig = { ...this.config, ...updates }
      const validated = BotConfigSchema.safeParse(newConfig)
      
      if (validated.success) {
        const oldConfig = { ...this.config }
        this.config = validated.data
        
        // Log changes
        Object.keys(updates).forEach(key => {
          if (key !== 'lastUpdated' && oldConfig[key as keyof BotConfig] !== this.config[key as keyof BotConfig]) {
            botLogger.configChange(key, oldConfig[key as keyof BotConfig], this.config[key as keyof BotConfig])
          }
        })
        
        this.saveConfig()
        return { success: true }
      } else {
        return { success: false, errors: validated.error.errors.map(e => e.message) }
      }
    } catch (error: any) {
      botLogger.error('Error updating configuration', error)
      return { success: false, errors: [error.message] }
    }
  }

  /**
   * Get whitelist
   */
  getWhitelist(): Whitelist {
    return { ...this.whitelist }
  }

  /**
   * Add user to whitelist
   */
  addToWhitelist(username: string, addedBy?: string, reason?: string): { success: boolean; error?: string } {
    try {
      const entry: WhitelistEntry = {
        username: username.toLowerCase(),
        addedAt: new Date().toISOString(),
        addedBy,
        reason,
        enabled: true
      }

      const validated = WhitelistEntrySchema.safeParse(entry)
      if (!validated.success) {
        return { success: false, error: 'Invalid whitelist entry' }
      }

      // Check if user already exists
      const existingIndex = this.whitelist.entries.findIndex(e => e.username === entry.username)
      if (existingIndex >= 0) {
        this.whitelist.entries[existingIndex] = entry
      } else {
        this.whitelist.entries.push(entry)
      }

      botLogger.whitelistChange('add', username, reason)
      this.saveWhitelist()
      
      return { success: true }
    } catch (error: any) {
      botLogger.error('Error adding to whitelist', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove user from whitelist
   */
  removeFromWhitelist(username: string): { success: boolean; error?: string } {
    try {
      const index = this.whitelist.entries.findIndex(e => e.username === username.toLowerCase())
      if (index >= 0) {
        const removed = this.whitelist.entries.splice(index, 1)[0]
        botLogger.whitelistChange('remove', username)
        this.saveWhitelist()
        return { success: true }
      } else {
        return { success: false, error: 'User not found in whitelist' }
      }
    } catch (error: any) {
      botLogger.error('Error removing from whitelist', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if user is whitelisted
   */
  isWhitelisted(username: string): boolean {
    if (!this.config.whitelistEnabled) {
      return true // If whitelist is disabled, allow everyone
    }

    const entry = this.whitelist.entries.find(e => e.username === username.toLowerCase())
    if (!entry) {
      return this.config.whitelistMode === 'deny' // If not in list, allow if mode is 'deny'
    }

    return entry.enabled && this.config.whitelistMode === 'allow'
  }

  /**
   * Get active system prompts
   */
  getActiveSystemPrompts(): SystemPromptModule[] {
    return this.config.systemPrompts
      .filter(prompt => prompt.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get combined system prompt
   */
  getCombinedSystemPrompt(): string {
    const activePrompts = this.getActiveSystemPrompts()
    if (activePrompts.length === 0) {
      return this.config.defaultSystemPrompt
    }

    const promptParts = activePrompts.map(prompt => prompt.prompt)
    return promptParts.join('\n\n')
  }

  /**
   * Add configuration watcher
   */
  addWatcher(watcher: (config: BotConfig) => void): void {
    this.watchers.add(watcher)
  }

  /**
   * Remove configuration watcher
   */
  removeWatcher(watcher: (config: BotConfig) => void): void {
    this.watchers.delete(watcher)
  }

  /**
   * Reload configuration from file
   */
  reload(): void {
    this.loadConfig()
    this.loadWhitelist()
    botLogger.info('Configuration reloaded')
  }

  /**
   * Get configuration health status
   */
  getHealthStatus(): {
    configLoaded: boolean
    whitelistLoaded: boolean
    configValid: boolean
    whitelistValid: boolean
    activePrompts: number
    whitelistEntries: number
  } {
    const configValid = BotConfigSchema.safeParse(this.config).success
    const whitelistValid = WhitelistSchema.safeParse(this.whitelist).success
    
    return {
      configLoaded: fs.existsSync(this.configPath),
      whitelistLoaded: fs.existsSync(this.whitelistPath),
      configValid,
      whitelistValid,
      activePrompts: this.getActiveSystemPrompts().length,
      whitelistEntries: this.whitelist.entries.length
    }
  }
}

// Create singleton instance
const configManager = new BotConfigManager()

export default configManager 