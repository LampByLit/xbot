'use client'

import { useState } from 'react'

interface ConfigFormProps {
  config: any
  onSave: (config: any) => void
  loading: boolean
}

export default function ConfigForm({ config, onSave, loading }: ConfigFormProps) {
  const [localConfig, setLocalConfig] = useState(config)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(localConfig)
  }

  const handleChange = (key: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="material-card">
      <h2 className="text-title mb-4">Bot Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bot Enabled
            </label>
            <input
              type="checkbox"
              checked={localConfig.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={localConfig.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtag
            </label>
            <input
              type="text"
              value={localConfig.hashtag}
              onChange={(e) => handleChange('hashtag', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Response Length
            </label>
            <input
              type="number"
              value={localConfig.maxResponseLength}
              onChange={(e) => handleChange('maxResponseLength', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Whitelist Enabled
              </label>
              <input
                type="checkbox"
                checked={localConfig.whitelistEnabled}
                onChange={(e) => handleChange('whitelistEnabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Reply
              </label>
              <input
                type="checkbox"
                checked={localConfig.autoReply}
                onChange={(e) => handleChange('autoReply', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Context
              </label>
              <input
                type="checkbox"
                checked={localConfig.includeContext}
                onChange={(e) => handleChange('includeContext', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Hashtags
              </label>
              <input
                type="checkbox"
                checked={localConfig.includeHashtags}
                onChange={(e) => handleChange('includeHashtags', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
} 