'use client'

import { useState } from 'react'

interface BotConfig {
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

interface ConfigFormProps {
  config: BotConfig
  onSave: (config: Partial<BotConfig>) => void
  loading?: boolean
}

export default function ConfigForm({ config, onSave, loading }: ConfigFormProps) {
  const [formData, setFormData] = useState<BotConfig>(config)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleToggle = (field: keyof BotConfig) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleChange = (field: keyof BotConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="material-card">
      <h2 className="text-title mb-6">Bot Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Core Settings</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium">Bot Enabled</label>
              <p className="text-caption">Enable or disable the bot</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('enabled')}
              className={`switch ${formData.enabled ? 'switch-enabled' : 'switch-disabled'}`}
            >
              <span className={`switch-thumb ${formData.enabled ? 'switch-thumb-enabled' : 'switch-thumb-disabled'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="input-field"
                placeholder="@username"
              />
            </div>
            
            <div>
              <label className="block text-body font-medium mb-2">Hashtag</label>
              <input
                type="text"
                value={formData.hashtag}
                onChange={(e) => handleChange('hashtag', e.target.value)}
                className="input-field"
                placeholder="#hey"
              />
            </div>
          </div>
        </div>

        {/* Response Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Response Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium mb-2">Max Response Length</label>
              <input
                type="number"
                min="1"
                max="280"
                value={formData.maxResponseLength}
                onChange={(e) => handleChange('maxResponseLength', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-body font-medium mb-2">Response Delay (ms)</label>
              <input
                type="number"
                min="0"
                max="60000"
                value={formData.responseDelay}
                onChange={(e) => handleChange('responseDelay', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-body font-medium">Auto Reply</label>
                <p className="text-caption">Automatically reply to mentions</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('autoReply')}
                className={`switch ${formData.autoReply ? 'switch-enabled' : 'switch-disabled'}`}
              >
                <span className={`switch-thumb ${formData.autoReply ? 'switch-thumb-enabled' : 'switch-thumb-disabled'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-body font-medium">Include Context</label>
                <p className="text-caption">Include tweet context in responses</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('includeContext')}
                className={`switch ${formData.includeContext ? 'switch-enabled' : 'switch-disabled'}`}
              >
                <span className={`switch-thumb ${formData.includeContext ? 'switch-thumb-enabled' : 'switch-thumb-disabled'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-body font-medium">Include Hashtags</label>
                <p className="text-caption">Include hashtags in responses</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('includeHashtags')}
                className={`switch ${formData.includeHashtags ? 'switch-enabled' : 'switch-disabled'}`}
              >
                <span className={`switch-thumb ${formData.includeHashtags ? 'switch-thumb-enabled' : 'switch-thumb-disabled'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Rate Limiting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium mb-2">Max Replies per Hour</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxRepliesPerHour}
                onChange={(e) => handleChange('maxRepliesPerHour', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-body font-medium mb-2">Max Replies per Day</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.maxRepliesPerDay}
                onChange={(e) => handleChange('maxRepliesPerDay', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Whitelist Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Whitelist Settings</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-body font-medium">Whitelist Enabled</label>
              <p className="text-caption">Enable user whitelist</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('whitelistEnabled')}
              className={`switch ${formData.whitelistEnabled ? 'switch-enabled' : 'switch-disabled'}`}
            >
              <span className={`switch-thumb ${formData.whitelistEnabled ? 'switch-thumb-enabled' : 'switch-thumb-disabled'}`} />
            </button>
          </div>

          <div>
            <label className="block text-body font-medium mb-2">Whitelist Mode</label>
            <select
              value={formData.whitelistMode}
              onChange={(e) => handleChange('whitelistMode', e.target.value as 'allow' | 'deny')}
              className="input-field"
            >
              <option value="allow">Allow only whitelisted users</option>
              <option value="deny">Block whitelisted users</option>
            </select>
          </div>
        </div>

        {/* Logging */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Logging</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body font-medium mb-2">Log Level</label>
              <select
                value={formData.logLevel}
                onChange={(e) => handleChange('logLevel', e.target.value as any)}
                className="input-field"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div>
              <label className="block text-body font-medium mb-2">Log Retention (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.logRetentionDays}
                onChange={(e) => handleChange('logRetentionDays', parseInt(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
} 