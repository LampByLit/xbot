import { NextRequest, NextResponse } from 'next/server'
import streamHandler from '@/bot/core/stream-handler'
import { botLogger } from '@/bot/utils/logger'

export async function GET() {
  try {
    const status = streamHandler.getStatus()
    const retryInfo = streamHandler.getRetryInfo()
    
    return NextResponse.json({
      success: true,
      status,
      retryInfo
    })
  } catch (error: any) {
    botLogger.error('Stream API GET error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stream status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        await streamHandler.start()
        return NextResponse.json({
          success: true,
          message: 'Stream handler started'
        })

      case 'stop':
        streamHandler.stop()
        return NextResponse.json({
          success: true,
          message: 'Stream handler stopped'
        })

      case 'clear-cache':
        streamHandler.clearCache()
        return NextResponse.json({
          success: true,
          message: 'Stream handler cache cleared'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or clear-cache' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    botLogger.error('Stream API POST error', error)
    return NextResponse.json(
      { success: false, error: 'Failed to control stream handler' },
      { status: 500 }
    )
  }
} 