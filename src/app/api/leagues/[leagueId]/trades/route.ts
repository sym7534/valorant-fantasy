import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

// GET /api/leagues/[leagueId]/trades — list trades
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
    const status = searchParams.get('status')

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Since the schema doesn't include a Trade model yet, we return empty for MVP
    // Trade functionality will be added when the schema is extended
    return NextResponse.json({
      trades: [],
      filter: status ?? 'all',
    })
  } catch (err) {
    console.error('GET trades error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leagues/[leagueId]/trades — create trade offer
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
    const { toUserId, offeredPlayerIds, requestedPlayerIds, scoreOffered, scoreRequested, note } = body as {
      toUserId: string
      offeredPlayerIds: string[]
      requestedPlayerIds: string[]
      scoreOffered?: number
      scoreRequested?: number
      note?: string
    }

    if (!toUserId || !Array.isArray(offeredPlayerIds) || !Array.isArray(requestedPlayerIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (offeredPlayerIds.length === 0 && (!scoreOffered || scoreOffered <= 0)) {
      return NextResponse.json({ error: 'Must offer at least one player or score' }, { status: 400 })
    }

    const fromMember = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    const toMember = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: toUserId } },
    })

    if (!fromMember || !toMember) {
      return NextResponse.json({ error: 'Both users must be league members' }, { status: 400 })
    }

    // Trade creation placeholder - will be fully implemented when Trade model is added to schema
    return NextResponse.json({
      trade: {
        id: 'pending-schema',
        leagueId,
        fromMemberId: fromMember.id,
        toMemberId: toMember.id,
        offeredPlayerIds,
        requestedPlayerIds,
        scoreOffered: scoreOffered ?? 0,
        scoreRequested: scoreRequested ?? 0,
        note: note ?? null,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error('POST trades error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
