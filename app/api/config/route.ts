import { NextRequest, NextResponse } from 'next/server'
import configManager from '../../../src/bot/config/bot-config'

export async function GET() {
  try {
    const config = configManager.getConfig()
    const health = configManager.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        config,
        health
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body
    
    const result = configManager.updateConfig(config)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          errors: result.errors
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
} 