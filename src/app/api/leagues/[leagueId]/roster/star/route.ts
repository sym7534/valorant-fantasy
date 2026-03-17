import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { STAR_PLAYER_COOLDOWN_WEEKS } from '@/src/lib/game-config'
import type { RosterStarRequest, RosterStarResponse, LineupSlotEntry } from '@/src/lib/api-types'

// PUT /api/leagues/[leagueId]/roster/star — designate star player
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterStarResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    const body = (await request.json()) as Partial<RosterStarRequest>

    if (!body.playerId || typeof body.playerId !== 'string') {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
    }

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

    // Check league is ACTIVE
    const league = await prisma.league.findUnique({ where: { id: leagueId } })
    if (!league || league.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'League is not in active state' }, { status: 400 })
    }

    // Get roster
    const roster = await prisma.roster.findUnique({
      where: { leagueMemberId: membership.id },
      include: { players: true },
    })

    if (!roster) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 })
    }

    // Verify player is on roster
    const rosterPlayer = roster.players.find((rp) => rp.playerId === body.playerId)
    if (!rosterPlayer) {
      return NextResponse.json({ error: 'Player is not on your roster' }, { status: 400 })
    }

    const weekNumber = body.weekNumber ?? 1

    // Check star player cooldown — look at recent weeks for this player being starred
    const recentLineups = await prisma.weeklyLineup.findMany({
      where: {
        rosterId: roster.id,
        weekNumber: {
          gte: weekNumber - STAR_PLAYER_COOLDOWN_WEEKS,
          lt: weekNumber,
        },
      },
      include: {
        slots: true,
      },
    })

    for (const lineup of recentLineups) {
      const wasStarred = lineup.slots.some(
        (s) => s.rosterPlayerId === rosterPlayer.id && s.isStarPlayer
      )
      if (wasStarred) {
        return NextResponse.json(
          {
            error: `This player was Star Player in week ${lineup.weekNumber} and is on cooldown for ${STAR_PLAYER_COOLDOWN_WEEKS} weeks`,
          },
          { status: 400 }
        )
      }
    }

    // Get or create current week lineup
    const currentLineup = await prisma.weeklyLineup.findUnique({
      where: {
        rosterId_weekNumber: {
          rosterId: roster.id,
          weekNumber,
        },
      },
      include: { slots: true },
    })

    if (!currentLineup) {
      return NextResponse.json(
        { error: 'No lineup set for this week — set a lineup first' },
        { status: 400 }
      )
    }

    if (currentLineup.isLocked) {
      return NextResponse.json({ error: 'Lineup is locked for this week' }, { status: 400 })
    }

    // Verify player is in the active lineup
    const playerSlot = currentLineup.slots.find((s) => s.rosterPlayerId === rosterPlayer.id)
    if (!playerSlot) {
      return NextResponse.json(
        { error: 'Player must be in your active lineup to be designated as Star Player' },
        { status: 400 }
      )
    }

    // Update: clear previous star player, set new one
    await prisma.$transaction(async (tx) => {
      // Remove star from all slots in this lineup
      await tx.lineupSlot.updateMany({
        where: {
          weeklyLineupId: currentLineup.id,
          isStarPlayer: true,
        },
        data: { isStarPlayer: false },
      })

      // Set star on selected player
      await tx.lineupSlot.update({
        where: { id: playerSlot.id },
        data: { isStarPlayer: true },
      })
    })

    // Fetch updated lineup
    const updatedLineup = await prisma.weeklyLineup.findUniqueOrThrow({
      where: { id: currentLineup.id },
      include: {
        slots: {
          include: {
            rosterPlayer: {
              include: {
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
            },
          },
        },
      },
    })

    const slots: LineupSlotEntry[] = updatedLineup.slots.map((s) => ({
      id: s.id,
      rosterPlayerId: s.rosterPlayerId,
      player: {
        id: s.rosterPlayer.player.id,
        name: s.rosterPlayer.player.name,
        team: s.rosterPlayer.player.team,
        region: s.rosterPlayer.player.region as LineupSlotEntry['player']['region'],
        role: s.rosterPlayer.player.role as LineupSlotEntry['player']['role'],
        imageUrl: s.rosterPlayer.player.imageUrl,
      },
      isStarPlayer: s.isStarPlayer,
      isCaptain: s.rosterPlayer.isCaptain,
    }))

    const response: RosterStarResponse = {
      lineup: {
        id: updatedLineup.id,
        weekNumber: updatedLineup.weekNumber,
        isLocked: updatedLineup.isLocked,
        slots,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('PUT /api/leagues/[leagueId]/roster/star error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
