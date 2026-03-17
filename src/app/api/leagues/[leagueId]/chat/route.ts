import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

// GET /api/leagues/[leagueId]/chat — get chat messages (paginated)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const before = searchParams.get('before')

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Chat messages placeholder - schema doesn't include ChatMessage model yet
    // Will return empty for MVP
    return NextResponse.json({
      messages: [],
      hasMore: false,
    })
  } catch (err) {
    console.error('GET chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leagues/[leagueId]/chat — send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId } = await params
    const body = await request.json()
    const { content } = body as { content: string }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 })
    }

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    return NextResponse.json({
      message: {
        id: crypto.randomUUID(),
        leagueId,
        userId: session.user.id,
        userName: session.user.name,
        userImage: session.user.image,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error('POST chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
