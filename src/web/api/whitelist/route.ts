import { NextRequest, NextResponse } from 'next/server'
import configManager from '@/bot/config/bot-config'
import { botLogger } from '@/bot/utils/logger'

export async function GET() {
  try {
    const whitelist = configManager.getWhitelist()
    
    return NextResponse.json({
      success: true,
      whitelist
    })
  } catch (error: any) {
    botLogger.error('Whitelist API GET error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load whitelist' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, addedBy, reason } = body
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const result = configManager.addToWhitelist(username, addedBy, reason)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `User ${username} added to whitelist`
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    botLogger.error('Whitelist API POST error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add user to whitelist' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const result = configManager.removeFromWhitelist(username)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `User ${username} removed from whitelist`
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    botLogger.error('Whitelist API DELETE error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove user from whitelist' },
      { status: 500 }
    )
  }
} 