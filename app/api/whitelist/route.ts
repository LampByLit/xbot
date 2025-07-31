import { NextRequest, NextResponse } from 'next/server'
import configManager from '../../../src/bot/config/bot-config'

export async function GET() {
  try {
    const whitelist = configManager.getWhitelist()
    
    return NextResponse.json({
      success: true,
      data: whitelist
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
    const { username, addedBy, reason } = body
    
    const result = configManager.addToWhitelist(username, addedBy, reason)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'User added to whitelist successfully'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username is required'
        },
        { status: 400 }
      )
    }
    
    const result = configManager.removeFromWhitelist(username)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'User removed from whitelist successfully'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
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