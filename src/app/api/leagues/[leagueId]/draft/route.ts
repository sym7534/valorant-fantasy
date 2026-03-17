import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import type { DraftGetResponse, DraftPickEntry } from '@/src/lib/api-types'

// GET /api/leagues/[leagueId]/draft — get full draft state
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftGetResponse | { error: string }>> {
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

    const draftState = await prisma.draftState.findUnique({
      where: { leagueId },
      include: {
        picks: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            player: {
              select: {
                id: true,
                name: true,
                team: true,
                region: true,
                role: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { pickNumber: 'asc' },
        },
      },
    })

    if (!draftState) {
      return NextResponse.json({ error: 'Draft has not been created yet' }, { status: 404 })
    }

    const picks: DraftPickEntry[] = draftState.picks.map((p) => ({
      id: p.id,
      userId: p.userId,
      user: {
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
      },
      playerId: p.playerId,
      player: {
        id: p.player.id,
        name: p.player.name,
        team: p.player.team,
        region: p.player.region as DraftPickEntry['player']['region'],
        role: p.player.role as DraftPickEntry['player']['role'],
        imageUrl: p.player.imageUrl,
      },
      round: p.round,
      pickNumber: p.pickNumber,
      isCaptain: p.isCaptain,
      pickedAt: p.pickedAt.toISOString(),
    }))

    const response: DraftGetResponse = {
      draft: {
        id: draftState.id,
        leagueId: draftState.leagueId,
        status: draftState.status as DraftGetResponse['draft']['status'],
        currentRound: draftState.currentRound,
        currentPickIndex: draftState.currentPickIndex,
        draftOrder: draftState.draftOrder as string[],
        picks,
        startedAt: draftState.startedAt?.toISOString() ?? null,
        completedAt: draftState.completedAt?.toISOString() ?? null,
        timeRemaining: null, // Timer is managed by Socket.io in real-time
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/leagues/[leagueId]/draft error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
