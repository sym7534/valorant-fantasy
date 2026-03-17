import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { MIN_LEAGUE_SIZE } from '@/src/lib/game-config'
import type { DraftStartResponse } from '@/src/lib/api-types'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// POST /api/leagues/[leagueId]/draft/start — start the draft (creator only)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftStartResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: {
        members: { select: { userId: true } },
      },
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Only creator can start draft
    if (league.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the league creator can start the draft' }, { status: 403 })
    }

    // League must be in SETUP status
    if (league.status !== 'SETUP') {
      return NextResponse.json({ error: 'Draft has already been started or league is completed' }, { status: 400 })
    }

    // Check minimum members
    if (league.members.length < MIN_LEAGUE_SIZE) {
      return NextResponse.json(
        { error: `At least ${MIN_LEAGUE_SIZE} members are needed to start the draft` },
        { status: 400 }
      )
    }

    // Check if draft state already exists
    const existingDraft = await prisma.draftState.findUnique({
      where: { leagueId },
    })

    if (existingDraft) {
      return NextResponse.json({ error: 'Draft already exists for this league' }, { status: 400 })
    }

    // Randomize draft order
    const memberUserIds = league.members.map((m) => m.userId)
    const draftOrder = shuffleArray(memberUserIds)

    // Create draft state and update league status in transaction
    const draftState = await prisma.$transaction(async (tx) => {
      await tx.league.update({
        where: { id: leagueId },
        data: { status: 'DRAFTING' },
      })

      return tx.draftState.create({
        data: {
          leagueId,
          status: 'IN_PROGRESS',
          currentRound: 1,
          currentPickIndex: 0,
          draftOrder: draftOrder,
          startedAt: new Date(),
        },
      })
    })

    const response: DraftStartResponse = {
      draft: {
        id: draftState.id,
        leagueId: draftState.leagueId,
        status: draftState.status as DraftStartResponse['draft']['status'],
        currentRound: draftState.currentRound,
        currentPickIndex: draftState.currentPickIndex,
        draftOrder: draftState.draftOrder as string[],
        picks: [],
        startedAt: draftState.startedAt?.toISOString() ?? null,
        completedAt: null,
        timeRemaining: league.draftPickTime,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('POST /api/leagues/[leagueId]/draft/start error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
