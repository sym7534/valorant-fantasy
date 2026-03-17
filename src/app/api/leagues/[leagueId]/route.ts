import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import type { LeagueDetailResponse } from '@/src/lib/api-types'

// GET /api/leagues/[leagueId] — get league details (member only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<LeagueDetailResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    // Check membership
    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId: session.user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 })
    }

    const league = await prisma.league.findUnique({
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

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const response: LeagueDetailResponse = {
      league: {
        id: league.id,
        name: league.name,
        inviteCode: league.inviteCode,
        status: league.status as LeagueDetailResponse['league']['status'],
        rosterSize: league.rosterSize,
        draftPickTime: league.draftPickTime,
        creatorId: league.creatorId,
        createdAt: league.createdAt.toISOString(),
        updatedAt: league.updatedAt.toISOString(),
        members: league.members.map((m) => ({
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
    console.error('GET /api/leagues/[leagueId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
