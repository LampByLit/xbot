import { NextResponse } from 'next/server'
import { xbot } from '@/bot/index'
import twitterClient from '@/bot/core/twitter-client'
import deepseekClient from '@/bot/core/deepseek-client'
import configManager from '@/bot/config/bot-config'
import { botLogger } from '@/bot/utils/logger'

export async function GET() {
  try {
    const botStatus = xbot.getStatus()
    const twitterStatus = twitterClient.getAuthStatus()
    const deepseekStatus = deepseekClient.getConnectionStatus()
    const configHealth = configManager.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      bot: {
        isRunning: botStatus.isRunning,
        startTime: botStatus.startTime,
        uptime: botStatus.uptime
      },
      twitter: {
        authenticated: twitterStatus.authenticated,
        config: twitterStatus.config
      },
      deepseek: {
        connected: deepseekStatus.connected,
        config: deepseekStatus.config
      },
      config: configHealth,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    botLogger.error('Status API error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    )
  }
} 