import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import type { RosterResponse, RosterPlayerEntry, LineupSlotEntry } from '@/src/lib/api-types'

// GET /api/leagues/[leagueId]/roster — get current user's roster
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterResponse | { error: string }>> {
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

    const roster = await prisma.roster.findUnique({
      where: { leagueMemberId: membership.id },
      include: {
        players: {
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
        lineups: {
          orderBy: { weekNumber: 'desc' },
          take: 1,
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
        },
      },
    })

    if (!roster) {
      return NextResponse.json({ error: 'Roster not found — draft may not be complete' }, { status: 404 })
    }

    const players: RosterPlayerEntry[] = roster.players.map((rp) => ({
      id: rp.id,
      playerId: rp.playerId,
      player: {
        id: rp.player.id,
        name: rp.player.name,
        team: rp.player.team,
        region: rp.player.region as RosterPlayerEntry['player']['region'],
        role: rp.player.role as RosterPlayerEntry['player']['role'],
        imageUrl: rp.player.imageUrl,
      },
      isCaptain: rp.isCaptain,
      slotType: rp.slotType as RosterPlayerEntry['slotType'],
    }))

    const currentLineup = roster.lineups[0] ?? null
    let activeLineup = null

    if (currentLineup) {
      const slots: LineupSlotEntry[] = currentLineup.slots.map((s) => ({
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

      activeLineup = {
        id: currentLineup.id,
        weekNumber: currentLineup.weekNumber,
        isLocked: currentLineup.isLocked,
        slots,
      }
    }

    const response: RosterResponse = {
      id: roster.id,
      leagueId,
      players,
      activeLineup,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/leagues/[leagueId]/roster error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
