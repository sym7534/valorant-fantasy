import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { MAX_LEAGUE_SIZE } from '@/src/lib/game-config'
import type { LeagueJoinRequest, LeagueJoinResponse } from '@/src/lib/api-types'

// POST /api/leagues/[leagueId]/join — join a league via invite code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<LeagueJoinResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    const body = (await request.json()) as Partial<LeagueJoinRequest>

    if (!body.inviteCode || typeof body.inviteCode !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        _count: { select: { members: true } },
      },
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check invite code (case-insensitive)
    if (league.inviteCode.toUpperCase() !== body.inviteCode.trim().toUpperCase()) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    // Check league status
    if (league.status !== 'SETUP') {
      return NextResponse.json(
        { error: 'Cannot join league — draft has already started or league is complete' },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId: session.user.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this league' }, { status: 400 })
    }

    // Check if league is full
    if (league._count.members >= MAX_LEAGUE_SIZE) {
      return NextResponse.json({ error: 'League is full' }, { status: 400 })
    }

    // Join the league
    await prisma.leagueMember.create({
      data: {
        leagueId,
        userId: session.user.id,
      },
    })

    // Fetch updated league
    const updatedLeague = await prisma.league.findUniqueOrThrow({
      where: { id: leagueId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })

    const response: LeagueJoinResponse = {
      league: {
        id: updatedLeague.id,
        name: updatedLeague.name,
        inviteCode: updatedLeague.inviteCode,
        status: updatedLeague.status as LeagueJoinResponse['league']['status'],
        rosterSize: updatedLeague.rosterSize,
        draftPickTime: updatedLeague.draftPickTime,
        creatorId: updatedLeague.creatorId,
        createdAt: updatedLeague.createdAt.toISOString(),
        updatedAt: updatedLeague.updatedAt.toISOString(),
        members: updatedLeague.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          user: {
            id: m.user.id,
            name: m.user.name,
            image: m.user.image,
          },
          joinedAt: m.joinedAt.toISOString(),
        })),
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('POST /api/leagues/[leagueId]/join error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
