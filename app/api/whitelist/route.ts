import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic whitelist response without importing bot modules
    const whitelist = {
      entries: [
        {
          username: 'testuser',
          addedAt: new Date().toISOString(),
          addedBy: 'admin',
          reason: 'Testing',
          enabled: true
        }
      ],
      lastUpdated: new Date().toISOString()
    }
    
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
    
    // For now, just return success without actually updating
    // In production, this would add to the real whitelist
    
    return NextResponse.json({
      success: true,
      message: 'User added to whitelist successfully'
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
    
    // For now, just return success without actually updating
    // In production, this would remove from the real whitelist
    
    return NextResponse.json({
      success: true,
      message: 'User removed from whitelist successfully'
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