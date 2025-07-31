import { NextResponse } from 'next/server'
import { xbot } from '../../../src/bot/index'

export async function GET() {
  try {
    const status = xbot.getStatus()
    
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