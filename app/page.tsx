'use client'

import { useState, useEffect } from 'react'
import LoginForm from '../components/auth/LoginForm'
import DashboardLayout from '../components/ui/DashboardLayout'
import ConfigForm from '../components/config/ConfigForm'
import { apiService, BotConfig } from '../components/services/api'

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<BotConfig | null>(null)
  const [status, setStatus] = useState<any>(null)

  // Simple password check - in production, this would be server-side
  const handleLogin = (password: string) => {
    const correctPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'admin'
    
    if (password === correctPassword) {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setError('')
  }

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [configResponse, statusResponse] = await Promise.all([
        apiService.getConfig(),
        apiService.getStatus()
      ])

      if (configResponse.success && configResponse.data) {
        setConfig(configResponse.data.config)
      }

      if (statusResponse.success && statusResponse.data) {
        setStatus(statusResponse.data)
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
    }
  }

  const handleSaveConfig = async (newConfig: Partial<BotConfig>) => {
    setLoading(true)
    
    try {
      const response = await apiService.updateConfig(newConfig)
      
      if (response.success) {
        // Reload config to get updated data
        await loadData()
      } else {
        setError(response.error || 'Failed to save configuration')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={error} />
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 mb-2">Loading...</div>
          <div className="text-sm text-gray-600">Please wait while we load your configuration</div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="material-card bg-red-50 border-red-200">
            <div className="text-red-800">
              <div className="font-medium">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}

        {/* Overview Section */}
        <div className="material-card">
          <h2 className="text-title mb-4">Bot Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {config.enabled ? '🟢' : '🔴'}
              </div>
              <div className="text-body font-medium mt-2">Status</div>
              <div className="text-caption">
                {config.enabled ? 'Running' : 'Stopped'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">@</div>
              <div className="text-body font-medium mt-2">Username</div>
              <div className="text-caption">{config.username}</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">#</div>
              <div className="text-body font-medium mt-2">Hashtag</div>
              <div className="text-caption">{config.hashtag}</div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <ConfigForm 
          config={config}
          onSave={handleSaveConfig}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  )
} 