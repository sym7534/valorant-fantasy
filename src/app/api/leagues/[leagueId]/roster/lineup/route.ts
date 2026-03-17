import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { ACTIVE_LINEUP_SIZE } from '@/src/lib/game-config'
import type { RosterLineupRequest, RosterLineupResponse, LineupSlotEntry } from '@/src/lib/api-types'

// PUT /api/leagues/[leagueId]/roster/lineup — set active lineup
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterLineupResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    const body = (await request.json()) as Partial<RosterLineupRequest>

    // Validate playerIds
    if (
      !body.playerIds ||
      !Array.isArray(body.playerIds) ||
      body.playerIds.length !== ACTIVE_LINEUP_SIZE
    ) {
      return NextResponse.json(
        { error: `Lineup must contain exactly ${ACTIVE_LINEUP_SIZE} players` },
        { status: 400 }
      )
    }

    // Check all are strings
    if (!body.playerIds.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'All playerIds must be strings' }, { status: 400 })
    }

    // Check for duplicates
    const uniqueIds = new Set(body.playerIds)
    if (uniqueIds.size !== body.playerIds.length) {
      return NextResponse.json({ error: 'Duplicate playerIds are not allowed' }, { status: 400 })
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
      include: {
        players: true,
      },
    })

    if (!roster) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 })
    }

    // Verify all player IDs belong to this roster
    const rosterPlayerIds = new Set(roster.players.map((rp) => rp.playerId))
    for (const pid of body.playerIds) {
      if (!rosterPlayerIds.has(pid)) {
        return NextResponse.json(
          { error: `Player ${pid} is not on your roster` },
          { status: 400 }
        )
      }
    }

    // Captain must be in active lineup
    const captainRosterPlayer = roster.players.find((rp) => rp.isCaptain)
    if (captainRosterPlayer && !body.playerIds.includes(captainRosterPlayer.playerId)) {
      return NextResponse.json(
        { error: 'Captain must be in the active lineup' },
        { status: 400 }
      )
    }

    const weekNumber = body.weekNumber ?? 1

    // Create or update lineup in transaction
    const lineup = await prisma.$transaction(async (tx) => {
      // Check if lineup exists for this week
      let weeklyLineup = await tx.weeklyLineup.findUnique({
        where: {
          rosterId_weekNumber: {
            rosterId: roster.id,
            weekNumber,
          },
        },
      })

      if (weeklyLineup?.isLocked) {
        throw new Error('Lineup is locked for this week')
      }

      if (weeklyLineup) {
        // Delete existing slots
        await tx.lineupSlot.deleteMany({
          where: { weeklyLineupId: weeklyLineup.id },
        })
      } else {
        weeklyLineup = await tx.weeklyLineup.create({
          data: {
            rosterId: roster.id,
            weekNumber,
            isLocked: false,
          },
        })
      }

      // Build roster player lookup by playerId
      const rosterPlayerMap = new Map(
        roster.players.map((rp) => [rp.playerId, rp])
      )

      // Create new lineup slots
      for (const playerId of body.playerIds!) {
        const rosterPlayer = rosterPlayerMap.get(playerId)
        if (!rosterPlayer) continue

        await tx.lineupSlot.create({
          data: {
            weeklyLineupId: weeklyLineup.id,
            rosterPlayerId: rosterPlayer.id,
            isStarPlayer: false,
          },
        })
      }

      return tx.weeklyLineup.findUniqueOrThrow({
        where: { id: weeklyLineup.id },
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
    })

    const slots: LineupSlotEntry[] = lineup.slots.map((s) => ({
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

    const response: RosterLineupResponse = {
      lineup: {
        id: lineup.id,
        weekNumber: lineup.weekNumber,
        isLocked: lineup.isLocked,
        slots,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    if (err instanceof Error && err.message === 'Lineup is locked for this week') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('PUT /api/leagues/[leagueId]/roster/lineup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
