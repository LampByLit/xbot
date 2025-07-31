import { z } from 'zod'
import { botLogger } from '../utils/logger'
import configManager, { SystemPromptModule } from './bot-config'

// System prompt module schema
const SystemPromptModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  prompt: z.string(),
  enabled: z.boolean(),
  priority: z.number().min(1).max(10),
  category: z.enum(['core', 'personality', 'functionality', 'custom']),
  tags: z.array(z.string()).optional(),
  version: z.string().optional()
})

export type SystemPromptModuleWithMeta = z.infer<typeof SystemPromptModuleSchema>

// Predefined system prompt modules
export const PREDEFINED_PROMPTS: SystemPromptModuleWithMeta[] = [
  {
    id: 'greeting',
    name: 'Greeting Module',
    description: 'Handles friendly greetings and introductions',
    prompt: 'You are a friendly Twitter bot. Respond warmly to greetings and be helpful. Always be polite and engaging.',
    enabled: true,
    priority: 1,
    category: 'core',
    tags: ['greeting', 'friendly', 'introduction'],
    version: '1.0.0'
  },
  {
    id: 'help',
    name: 'Help Module',
    description: 'Provides help and information about the bot',
    prompt: 'You can help users understand what you do and how to interact with you. Be informative and helpful.',
    enabled: true,
    priority: 2,
    category: 'functionality',
    tags: ['help', 'information', 'support'],
    version: '1.0.0'
  },
  {
    id: 'conversation',
    name: 'Conversation Module',
    description: 'Handles general conversation and questions',
    prompt: 'Engage in natural conversation. Be helpful, informative, and friendly. Ask follow-up questions when appropriate.',
    enabled: true,
    priority: 3,
    category: 'personality',
    tags: ['conversation', 'engagement', 'interactive'],
    version: '1.0.0'
  },
  {
    id: 'humor',
    name: 'Humor Module',
    description: 'Adds light humor and personality to responses',
    prompt: 'You have a good sense of humor. Use appropriate jokes and witty responses when the context allows. Keep it light and fun.',
    enabled: false,
    priority: 4,
    category: 'personality',
    tags: ['humor', 'fun', 'personality'],
    version: '1.0.0'
  },
  {
    id: 'knowledge',
    name: 'Knowledge Module',
    description: 'Provides informative and educational responses',
    prompt: 'You are knowledgeable and can provide helpful information on various topics. Be accurate and informative.',
    enabled: false,
    priority: 5,
    category: 'functionality',
    tags: ['knowledge', 'education', 'information'],
    version: '1.0.0'
  },
  {
    id: 'safety',
    name: 'Safety Module',
    description: 'Ensures safe and appropriate responses',
    prompt: 'Always respond in a safe, appropriate manner. Avoid harmful, offensive, or inappropriate content.',
    enabled: true,
    priority: 10,
    category: 'core',
    tags: ['safety', 'appropriate', 'moderation'],
    version: '1.0.0'
  }
]

class SystemPromptsManager {
  private customPrompts: Map<string, SystemPromptModuleWithMeta> = new Map()

  constructor() {
    this.loadCustomPrompts()
  }

  /**
   * Get all available prompt modules (predefined + custom)
   */
  getAllPromptModules(): SystemPromptModuleWithMeta[] {
    const customPrompts = Array.from(this.customPrompts.values())
    return [...PREDEFINED_PROMPTS, ...customPrompts]
  }

  /**
   * Get active prompt modules
   */
  getActivePromptModules(): SystemPromptModuleWithMeta[] {
    const config = configManager.getConfig()
    const allPrompts = this.getAllPromptModules()
    
    return allPrompts
      .filter(prompt => {
        const configPrompt = config.systemPrompts.find(p => p.id === prompt.id)
        return configPrompt?.enabled ?? prompt.enabled
      })
      .sort((a, b) => {
        const configPromptA = config.systemPrompts.find(p => p.id === a.id)
        const configPromptB = config.systemPrompts.find(p => p.id === b.id)
        return (configPromptA?.priority ?? a.priority) - (configPromptB?.priority ?? b.priority)
      })
  }

  /**
   * Get combined system prompt
   */
  getCombinedSystemPrompt(): string {
    const activePrompts = this.getActivePromptModules()
    
    if (activePrompts.length === 0) {
      return configManager.getConfig().defaultSystemPrompt
    }

    const promptParts = activePrompts.map(prompt => prompt.prompt)
    return promptParts.join('\n\n')
  }

  /**
   * Add custom prompt module
   */
  addCustomPrompt(module: SystemPromptModuleWithMeta): { success: boolean; error?: string } {
    try {
      const validated = SystemPromptModuleSchema.safeParse(module)
      if (!validated.success) {
        return { success: false, error: 'Invalid prompt module format' }
      }

      if (this.customPrompts.has(module.id)) {
        return { success: false, error: 'Prompt module with this ID already exists' }
      }

      this.customPrompts.set(module.id, validated.data)
      this.saveCustomPrompts()
      
      botLogger.info('Custom prompt module added', {
        id: module.id,
        name: module.name,
        category: module.category
      })

      return { success: true }
    } catch (error: any) {
      botLogger.error('Error adding custom prompt module', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update custom prompt module
   */
  updateCustomPrompt(id: string, updates: Partial<SystemPromptModuleWithMeta>): { success: boolean; error?: string } {
    try {
      const existing = this.customPrompts.get(id)
      if (!existing) {
        return { success: false, error: 'Custom prompt module not found' }
      }

      const updated = { ...existing, ...updates }
      const validated = SystemPromptModuleSchema.safeParse(updated)
      if (!validated.success) {
        return { success: false, error: 'Invalid prompt module format' }
      }

      this.customPrompts.set(id, validated.data)
      this.saveCustomPrompts()
      
      botLogger.info('Custom prompt module updated', {
        id,
        name: updated.name
      })

      return { success: true }
    } catch (error: any) {
      botLogger.error('Error updating custom prompt module', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Remove custom prompt module
   */
  removeCustomPrompt(id: string): { success: boolean; error?: string } {
    try {
      const existing = this.customPrompts.get(id)
      if (!existing) {
        return { success: false, error: 'Custom prompt module not found' }
      }

      this.customPrompts.delete(id)
      this.saveCustomPrompts()
      
      botLogger.info('Custom prompt module removed', {
        id,
        name: existing.name
      })

      return { success: true }
    } catch (error: any) {
      botLogger.error('Error removing custom prompt module', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get prompt module by ID
   */
  getPromptModule(id: string): SystemPromptModuleWithMeta | null {
    const predefined = PREDEFINED_PROMPTS.find(p => p.id === id)
    if (predefined) return predefined

    return this.customPrompts.get(id) || null
  }

  /**
   * Enable/disable prompt module
   */
  togglePromptModule(id: string, enabled: boolean): { success: boolean; error?: string } {
    try {
      const config = configManager.getConfig()
      const prompt = config.systemPrompts.find(p => p.id === id)
      
      if (!prompt) {
        return { success: false, error: 'Prompt module not found in configuration' }
      }

      const updates = {
        systemPrompts: config.systemPrompts.map(p => 
          p.id === id ? { ...p, enabled } : p
        )
      }

      const result = configManager.updateConfig(updates)
      if (result.success) {
        botLogger.info(`Prompt module ${enabled ? 'enabled' : 'disabled'}`, {
          id,
          name: prompt.name
        })
      }

      return result
    } catch (error: any) {
      botLogger.error('Error toggling prompt module', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Update prompt module priority
   */
  updatePromptPriority(id: string, priority: number): { success: boolean; error?: string } {
    try {
      if (priority < 1 || priority > 10) {
        return { success: false, error: 'Priority must be between 1 and 10' }
      }

      const config = configManager.getConfig()
      const prompt = config.systemPrompts.find(p => p.id === id)
      
      if (!prompt) {
        return { success: false, error: 'Prompt module not found in configuration' }
      }

      const updates = {
        systemPrompts: config.systemPrompts.map(p => 
          p.id === id ? { ...p, priority } : p
        )
      }

      const result = configManager.updateConfig(updates)
      if (result.success) {
        botLogger.info('Prompt module priority updated', {
          id,
          name: prompt.name,
          priority
        })
      }

      return result
    } catch (error: any) {
      botLogger.error('Error updating prompt priority', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get prompt modules by category
   */
  getPromptModulesByCategory(category: string): SystemPromptModuleWithMeta[] {
    return this.getAllPromptModules().filter(p => p.category === category)
  }

  /**
   * Get prompt modules by tag
   */
  getPromptModulesByTag(tag: string): SystemPromptModuleWithMeta[] {
    return this.getAllPromptModules().filter(p => p.tags?.includes(tag))
  }

  /**
   * Load custom prompts from storage
   */
  private loadCustomPrompts(): void {
    try {
      // In a real implementation, this would load from persistent storage
      // For now, we'll keep them in memory
      botLogger.info('Custom prompts loaded', {
        count: this.customPrompts.size
      })
    } catch (error: any) {
      botLogger.error('Error loading custom prompts', error)
    }
  }

  /**
   * Save custom prompts to storage
   */
  private saveCustomPrompts(): void {
    try {
      // In a real implementation, this would save to persistent storage
      botLogger.info('Custom prompts saved', {
        count: this.customPrompts.size
      })
    } catch (error: any) {
      botLogger.error('Error saving custom prompts', error)
    }
  }

  /**
   * Get prompt statistics
   */
  getPromptStatistics(): {
    total: number
    active: number
    predefined: number
    custom: number
    byCategory: Record<string, number>
  } {
    const allPrompts = this.getAllPromptModules()
    const activePrompts = this.getActivePromptModules()
    
    const byCategory: Record<string, number> = {}
    allPrompts.forEach(prompt => {
      byCategory[prompt.category] = (byCategory[prompt.category] || 0) + 1
    })

    return {
      total: allPrompts.length,
      active: activePrompts.length,
      predefined: PREDEFINED_PROMPTS.length,
      custom: this.customPrompts.size,
      byCategory
    }
  }

  /**
   * Validate prompt module
   */
  validatePromptModule(module: any): { valid: boolean; errors?: string[] } {
    const result = SystemPromptModuleSchema.safeParse(module)
    if (result.success) {
      return { valid: true }
    } else {
      return { 
        valid: false, 
        errors: result.error.errors.map(e => e.message) 
      }
    }
  }
}

// Create singleton instance
const systemPromptsManager = new SystemPromptsManager()

export default systemPromptsManager 