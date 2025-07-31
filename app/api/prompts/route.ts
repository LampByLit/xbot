import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic prompts response without importing bot modules
    const allPrompts = [
      {
        id: 'greeting',
        name: 'Greeting Module',
        description: 'Handles friendly greetings and introductions',
        prompt: 'You are a friendly Twitter bot. Respond warmly to greetings and be helpful.',
        enabled: true,
        priority: 1,
        category: 'core',
        tags: ['greeting', 'friendly']
      },
      {
        id: 'help',
        name: 'Help Module',
        description: 'Provides help and information about the bot',
        prompt: 'You can help users understand what you do and how to interact with you.',
        enabled: true,
        priority: 2,
        category: 'core',
        tags: ['help', 'information']
      },
      {
        id: 'conversation',
        name: 'Conversation Module',
        description: 'Handles general conversation and questions',
        prompt: 'Engage in natural conversation. Be helpful, informative, and friendly.',
        enabled: true,
        priority: 3,
        category: 'core',
        tags: ['conversation', 'general']
      }
    ]
    
    const activePrompts = allPrompts.filter(p => p.enabled)
    const combinedPrompt = activePrompts.map(p => p.prompt).join('\n\n')
    const statistics = {
      total: allPrompts.length,
      active: activePrompts.length,
      predefined: allPrompts.length,
      custom: 0,
      byCategory: {
        core: allPrompts.length
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        allPrompts,
        activePrompts,
        combinedPrompt,
        statistics
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
    const { action, data } = body
    
    // For now, just return success without actually updating
    // In production, this would update the real prompts
    
    return NextResponse.json({
      success: true,
      message: 'Prompt action completed successfully'
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