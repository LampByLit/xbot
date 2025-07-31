import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic status response without importing bot modules
    const status = {
      isRunning: false,
      startTime: null,
      uptime: 0,
      twitterStatus: {
        authenticated: false,
        config: {}
      },
      deepseekStatus: {
        connected: false,
        config: {}
      },
      configStatus: {
        config: {
          configLoaded: false,
          whitelistLoaded: false,
          configValid: false,
          whitelistValid: false,
          activePrompts: 0,
          whitelistEntries: 0
        },
        prompts: {
          total: 0,
          active: 0,
          predefined: 0,
          custom: 0,
          byCategory: {}
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: status
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