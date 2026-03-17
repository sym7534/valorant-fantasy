import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'

// GET /api/notifications — get user's notifications
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Notifications placeholder — schema doesn't have Notification model yet
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    })
  } catch (err) {
    console.error('GET notifications error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { notificationIds, markAllRead } = body as {
      notificationIds?: string[]
      markAllRead?: boolean
    }

    if (!markAllRead && (!Array.isArray(notificationIds) || notificationIds.length === 0)) {
      return NextResponse.json({ error: 'Provide notificationIds or markAllRead' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH notifications error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
