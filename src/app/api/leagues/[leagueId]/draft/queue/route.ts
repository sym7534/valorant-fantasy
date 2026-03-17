import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

// GET /api/leagues/[leagueId]/draft/queue — get user's draft queue
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId } = await params

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Draft queue is stored as JSON on the DraftState or as a separate concept.
    // We'll store it as a JSON field. For now, use a simple approach with roster metadata.
    // Since the schema doesn't have a DraftQueue model, we'll use a lightweight approach
    // storing queue in the draft state's metadata or a separate table.
    // For MVP, return empty queue - the frontend manages queue client-side.
    return NextResponse.json({ queue: [] })
  } catch (err) {
    console.error('GET draft/queue error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/leagues/[leagueId]/draft/queue — update user's draft queue
export async function PUT(
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
    const { playerIds } = body as { playerIds: string[] }

    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'playerIds must be an array' }, { status: 400 })
    }

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // For MVP, acknowledge the queue update - actual queue is managed client-side
    // and used during auto-pick
    return NextResponse.json({ queue: playerIds.map((id, i) => ({ playerId: id, priority: i })) })
  } catch (err) {
    console.error('PUT draft/queue error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
