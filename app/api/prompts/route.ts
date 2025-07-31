import { NextRequest, NextResponse } from 'next/server'
import systemPromptsManager from '../../../src/bot/config/system-prompts'

export async function GET() {
  try {
    const allPrompts = systemPromptsManager.getAllPromptModules()
    const activePrompts = systemPromptsManager.getActivePromptModules()
    const combinedPrompt = systemPromptsManager.getCombinedSystemPrompt()
    const statistics = systemPromptsManager.getPromptStatistics()
    
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
    
    switch (action) {
      case 'toggle':
        const toggleResult = systemPromptsManager.togglePromptModule(data.id, data.enabled)
        if (toggleResult.success) {
          return NextResponse.json({
            success: true,
            message: `Prompt module ${data.enabled ? 'enabled' : 'disabled'} successfully`
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: toggleResult.error
            },
            { status: 400 }
          )
        }
        
      case 'updatePriority':
        const priorityResult = systemPromptsManager.updatePromptPriority(data.id, data.priority)
        if (priorityResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Prompt priority updated successfully'
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: priorityResult.error
            },
            { status: 400 }
          )
        }
        
      case 'addCustom':
        const addResult = systemPromptsManager.addCustomPrompt(data)
        if (addResult.success) {
          return NextResponse.json({
            success: true,
            message: 'Custom prompt added successfully'
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: addResult.error
            },
            { status: 400 }
          )
        }
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action'
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