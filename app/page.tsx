'use client'

import { useState, useEffect } from 'react'
import LoginForm from '../components/auth/LoginForm'
import DashboardLayout from '../components/ui/DashboardLayout'
import ConfigForm from '../components/config/ConfigForm'

// Mock data for now - will be replaced with real API calls
const mockConfig = {
  enabled: true,
  username: 'recapitul8r',
  hashtag: 'hey',
  maxResponseLength: 280,
  responseDelay: 1000,
  whitelistEnabled: false,
  whitelistMode: 'allow' as const,
  maxRepliesPerHour: 50,
  maxRepliesPerDay: 500,
  logLevel: 'info' as const,
  logRetentionDays: 7,
  autoReply: true,
  includeContext: true,
  includeHashtags: true
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(mockConfig)

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

  const handleSaveConfig = async (newConfig: any) => {
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setConfig(newConfig)
    setLoading(false)
    
    // In production, this would call the actual API
    console.log('Saving config:', newConfig)
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} error={error} />
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
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