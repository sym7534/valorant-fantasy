import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

// GET /api/user/settings — get user profile and preferences
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      notifications: {
        draftTurn: true,
        tradeReceived: true,
        tradeResolved: true,
        weekResults: true,
        lineupReminder: true,
      },
    })
  } catch (err) {
    console.error('GET user/settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/user/settings — update user profile or preferences
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body as { name?: string }

    const updates: Record<string, unknown> = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      if (name.length > 50) {
        return NextResponse.json({ error: 'Name too long (max 50 chars)' }, { status: 400 })
      }
      updates.name = name.trim()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, name: true, email: true, image: true },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('PATCH user/settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
