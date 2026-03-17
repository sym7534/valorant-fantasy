import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { CAPTAIN_ROUND, ROLE_SLOTS_BY_ROSTER_SIZE } from '@/src/lib/game-config'
import type { DraftPickRequest, DraftPickResponse, DraftPickEntry } from '@/src/lib/api-types'

// TODO(lead): DraftPick model may need a `slotType` field for tracking which
// slot type was assigned during drafting. If schema.prisma doesn't include it,
// we'll need to derive slot type from the user's RosterPlayer records instead.

/**
 * Determine the current picker's userId based on snake draft logic.
 * Even rounds go forward (0..N-1), odd rounds go backward (N-1..0).
 * Rounds are 1-indexed.
 */
function getCurrentPickerUserId(draftOrder: string[], round: number, pickIndex: number): string {
  const isEvenRound = round % 2 === 0
  // In snake draft: odd rounds go forward, even rounds go backward
  if (isEvenRound) {
    // Reverse direction
    return draftOrder[draftOrder.length - 1 - pickIndex]
  }
  return draftOrder[pickIndex]
}

/**
 * Determine the SlotType for a picked player based on what slots
 * the user still needs to fill.
 */
function determineSlotType(
  playerRole: string,
  existingPicks: Array<{ role: string; slotType: string }>,
  rosterSize: number
): string {
  const slotConfig = ROLE_SLOTS_BY_ROSTER_SIZE[rosterSize]
  if (!slotConfig) return 'Wildcard'

  // Count how many of each slot type are already filled
  const filledSlots: Record<string, number> = {}
  for (const pick of existingPicks) {
    filledSlots[pick.slotType] = (filledSlots[pick.slotType] || 0) + 1
  }

  // First try to fill the matching role slot
  const roleSlotCount = slotConfig[playerRole as keyof typeof slotConfig] ?? 0
  const roleFilled = filledSlots[playerRole] ?? 0
  if (roleFilled < roleSlotCount) {
    return playerRole
  }

  // Otherwise use a Wildcard slot
  const wildcardCount = slotConfig['Wildcard'] ?? 0
  const wildcardFilled = filledSlots['Wildcard'] ?? 0
  if (wildcardFilled < wildcardCount) {
    return 'Wildcard'
  }

  // Fallback — assign to any role that still has open slots
  for (const [slot, count] of Object.entries(slotConfig)) {
    const filled = filledSlots[slot] ?? 0
    if (filled < count) {
      return slot
    }
  }

  return 'Wildcard'
}

// POST /api/leagues/[leagueId]/draft/pick — make a draft pick
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftPickResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { leagueId } = await params

  try {
    const body = (await request.json()) as Partial<DraftPickRequest>

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

    // Get draft state
    const draftState = await prisma.draftState.findUnique({
      where: { leagueId },
      include: {
        picks: {
          include: {
            player: { select: { role: true } },
          },
        },
      },
    })

    if (!draftState) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    if (draftState.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Draft is not in progress' }, { status: 400 })
    }

    const draftOrder = draftState.draftOrder as string[]
    const currentPickerUserId = getCurrentPickerUserId(
      draftOrder,
      draftState.currentRound,
      draftState.currentPickIndex
    )

    // Validate it is this user's turn
    if (currentPickerUserId !== session.user.id) {
      return NextResponse.json({ error: 'It is not your turn to pick' }, { status: 400 })
    }

    // Check player exists
    const player = await prisma.player.findUnique({
      where: { id: body.playerId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Check player hasn't already been drafted in this draft
    const alreadyDrafted = draftState.picks.some((p) => p.playerId === body.playerId)
    if (alreadyDrafted) {
      return NextResponse.json({ error: 'Player has already been drafted' }, { status: 400 })
    }

    // Get league for roster size
    const league = await prisma.league.findUniqueOrThrow({
      where: { id: leagueId },
    })

    // Determine slot type
    const userPicks = draftState.picks
      .filter((p) => p.userId === session.user.id)
      .map((p) => ({ role: p.player.role, slotType: p.slotType ?? 'Wildcard' }))

    const slotType = determineSlotType(player.role, userPicks, league.rosterSize)

    // Is this the captain round?
    const isCaptain = draftState.currentRound === CAPTAIN_ROUND

    // Calculate next round/pick
    const totalMembers = draftOrder.length
    const totalRounds = league.rosterSize
    let nextRound = draftState.currentRound
    let nextPickIndex = draftState.currentPickIndex + 1
    let draftComplete = false

    if (nextPickIndex >= totalMembers) {
      nextRound++
      nextPickIndex = 0
      if (nextRound > totalRounds) {
        draftComplete = true
      }
    }

    const pickNumber = (draftState.currentRound - 1) * totalMembers + draftState.currentPickIndex + 1

    // Create pick, update draft state, create roster player — all in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newPick = await tx.draftPick.create({
        data: {
          draftStateId: draftState.id,
          userId: session.user!.id,
          playerId: body.playerId!,
          round: draftState.currentRound,
          pickNumber,
          isCaptain,
          slotType,
        },
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
      })

      // Ensure roster exists for this member
      let roster = await tx.roster.findUnique({
        where: { leagueMemberId: membership.id },
      })

      if (!roster) {
        roster = await tx.roster.create({
          data: {
            leagueMemberId: membership.id,
            leagueId,
          },
        })
      }

      // Add player to roster
      await tx.rosterPlayer.create({
        data: {
          rosterId: roster.id,
          playerId: body.playerId!,
          isCaptain,
          slotType,
        },
      })

      // Update draft state
      if (draftComplete) {
        await tx.draftState.update({
          where: { id: draftState.id },
          data: {
            status: 'COMPLETE',
            completedAt: new Date(),
            currentRound: nextRound,
            currentPickIndex: nextPickIndex,
          },
        })

        // Update league status to ACTIVE
        await tx.league.update({
          where: { id: leagueId },
          data: { status: 'ACTIVE' },
        })
      } else {
        await tx.draftState.update({
          where: { id: draftState.id },
          data: {
            currentRound: nextRound,
            currentPickIndex: nextPickIndex,
          },
        })
      }

      return newPick
    })

    // Fetch updated draft state for response
    const updatedDraft = await prisma.draftState.findUniqueOrThrow({
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

    const allPicks: DraftPickEntry[] = updatedDraft.picks.map((p) => ({
      id: p.id,
      userId: p.userId,
      user: { id: p.user.id, name: p.user.name, image: p.user.image },
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

    const response: DraftPickResponse = {
      pick: {
        id: result.id,
        userId: result.userId,
        user: { id: result.user.id, name: result.user.name, image: result.user.image },
        playerId: result.playerId,
        player: {
          id: result.player.id,
          name: result.player.name,
          team: result.player.team,
          region: result.player.region as DraftPickEntry['player']['region'],
          role: result.player.role as DraftPickEntry['player']['role'],
          imageUrl: result.player.imageUrl,
        },
        round: result.round,
        pickNumber: result.pickNumber,
        isCaptain: result.isCaptain,
        pickedAt: result.pickedAt.toISOString(),
      },
      draft: {
        id: updatedDraft.id,
        leagueId: updatedDraft.leagueId,
        status: updatedDraft.status as DraftPickResponse['draft']['status'],
        currentRound: updatedDraft.currentRound,
        currentPickIndex: updatedDraft.currentPickIndex,
        draftOrder: updatedDraft.draftOrder as string[],
        picks: allPicks,
        startedAt: updatedDraft.startedAt?.toISOString() ?? null,
        completedAt: updatedDraft.completedAt?.toISOString() ?? null,
        timeRemaining: null,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('POST /api/leagues/[leagueId]/draft/pick error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
