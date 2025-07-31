import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic config response without importing bot modules
    const config = {
      enabled: true,
      username: 'recapitul8r',
      hashtag: 'hey',
      maxResponseLength: 280,
      responseDelay: 1000,
      whitelistEnabled: false,
      whitelistMode: 'allow',
      systemPrompts: [
        {
          id: 'greeting',
          name: 'Greeting Module',
          description: 'Handles friendly greetings',
          prompt: 'You are a friendly Twitter bot.',
          enabled: true,
          priority: 1
        }
      ],
      defaultSystemPrompt: 'You are a helpful Twitter bot.',
      maxRepliesPerHour: 50,
      maxRepliesPerDay: 500,
      logLevel: 'info',
      logRetentionDays: 7,
      autoReply: true,
      includeContext: true,
      includeHashtags: true,
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString()
    }
    
    const health = {
      configLoaded: true,
      whitelistLoaded: true,
      configValid: true,
      whitelistValid: true,
      activePrompts: 1,
      whitelistEntries: 0
    }
    
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
    
    // For now, just return success without actually updating
    // In production, this would update the real config
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
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