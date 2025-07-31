import { NextRequest, NextResponse } from 'next/server'
import configManager from '@/bot/config/bot-config'
import { botLogger } from '@/bot/utils/logger'

export async function GET() {
  try {
    const config = configManager.getConfig()
    const health = configManager.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      config,
      health
    })
  } catch (error: any) {
    botLogger.error('Config API GET error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = configManager.updateConfig(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      )
    }
  } catch (error: any) {
    botLogger.error('Config API POST error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
} 