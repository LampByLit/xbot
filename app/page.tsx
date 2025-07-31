'use client'

import React from 'react'
import { Sidebar } from '../src/web/components/ui/sidebar'
import { DashboardLayout } from './dashboard-layout'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline'

// Mock data for now - will be replaced with real API calls
const mockStatus = {
  bot: {
    isRunning: true,
    uptime: 3600000, // 1 hour in ms
    startTime: new Date(Date.now() - 3600000).toISOString()
  },
  twitter: {
    connected: true,
    authenticated: true
  },
  deepseek: {
    connected: true,
    model: 'deepseek-chat'
  },
  config: {
    configLoaded: true,
    whitelistLoaded: true,
    activePrompts: 3,
    whitelistEntries: 5
  }
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

function StatusCard({ 
  title, 
  status, 
  icon: Icon, 
  description, 
  color = 'blue' 
}: {
  title: string
  status: boolean
  icon: React.ComponentType<{ className?: string }>
  description: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  }

  return (
    <div className="md-card p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="md-title">{title}</h3>
          <p className="md-body">{description}</p>
        </div>
        <div className="flex items-center">
          {status ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue' 
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  }

  return (
    <div className="md-card p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-4">
          <p className="md-caption text-gray-600">{title}</p>
          <p className="md-headline">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <h1 className="md-headline">Dashboard</h1>
              <p className="md-body mt-1">Overview of your XBot status and performance</p>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Status Overview */}
              <div>
                <h2 className="md-title mb-4">System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatusCard
                    title="Bot Status"
                    status={mockStatus.bot.isRunning}
                    icon={CogIcon}
                    description={mockStatus.bot.isRunning ? 'Bot is running' : 'Bot is stopped'}
                    color={mockStatus.bot.isRunning ? 'green' : 'red'}
                  />
                  <StatusCard
                    title="Twitter API"
                    status={mockStatus.twitter.connected}
                    icon={ChatBubbleLeftRightIcon}
                    description={mockStatus.twitter.connected ? 'Connected and authenticated' : 'Connection failed'}
                    color={mockStatus.twitter.connected ? 'green' : 'red'}
                  />
                  <StatusCard
                    title="DeepSeek API"
                    status={mockStatus.deepseek.connected}
                    icon={ChatBubbleLeftRightIcon}
                    description={mockStatus.deepseek.connected ? `Connected (${mockStatus.deepseek.model})` : 'Connection failed'}
                    color={mockStatus.deepseek.connected ? 'green' : 'red'}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h2 className="md-title mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Uptime"
                    value={formatUptime(mockStatus.bot.uptime)}
                    icon={ClockIcon}
                    color="blue"
                  />
                  <MetricCard
                    title="Active Prompts"
                    value={mockStatus.config.activePrompts}
                    icon={ChatBubbleLeftRightIcon}
                    color="green"
                  />
                  <MetricCard
                    title="Whitelist Entries"
                    value={mockStatus.config.whitelistEntries}
                    icon={UsersIcon}
                    color="purple"
                  />
                  <MetricCard
                    title="Configuration"
                    value="Loaded"
                    icon={CogIcon}
                    color="orange"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="md-title mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="md-card p-6 text-left hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CogIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="md-subtitle">Start Bot</h3>
                        <p className="md-caption">Activate the bot if stopped</p>
                      </div>
                    </div>
                  </button>

                  <button className="md-card p-6 text-left hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <XCircleIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="md-subtitle">Stop Bot</h3>
                        <p className="md-caption">Deactivate the bot</p>
                      </div>
                    </div>
                  </button>

                  <button className="md-card p-6 text-left hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <h3 className="md-subtitle">Test Response</h3>
                        <p className="md-caption">Test bot response generation</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="md-title mb-4">Recent Activity</h2>
                <div className="md-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="md-body">Bot started successfully</span>
                      <span className="md-caption ml-auto">2 minutes ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="md-body">Configuration updated</span>
                      <span className="md-caption ml-auto">5 minutes ago</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="md-body">User added to whitelist</span>
                      <span className="md-caption ml-auto">10 minutes ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  )
} 