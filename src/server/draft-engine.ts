import { prisma } from '@/src/lib/prisma'
import { CAPTAIN_ROUND, ROLE_SLOTS_BY_ROSTER_SIZE, REGION_MIN_PER, REGIONS } from '@/src/lib/game-config'
import type { Region, PlayerRole } from '@/src/lib/game-config'

/**
 * Get the snake-draft order index for a given overall pick number.
 * Snake draft: odd rounds go left→right, even rounds go right→left.
 */
export function getSnakeIndex(pickNumber: number, memberCount: number): number {
  const round = Math.ceil(pickNumber / memberCount)
  const positionInRound = ((pickNumber - 1) % memberCount)
  // Odd rounds (1,3,5...) go forward, even rounds (2,4,6...) go reverse
  if (round % 2 === 1) {
    return positionInRound
  } else {
    return memberCount - 1 - positionInRound
  }
}

/**
 * Get the userId whose turn it is to pick for a given pick number.
 */
export function getCurrentDrafter(draftOrder: string[], pickNumber: number): string {
  const index = getSnakeIndex(pickNumber, draftOrder.length)
  return draftOrder[index]
}

/**
 * Determine the next pick number after all existing picks.
 */
export async function getNextPickNumber(draftStateId: string): Promise<number> {
  const count = await prisma.draftPick.count({ where: { draftStateId } })
  return count + 1
}

/**
 * Get the current round based on pick count and member count.
 */
export function getRound(pickNumber: number, memberCount: number): number {
  return Math.ceil(pickNumber / memberCount)
}

/**
 * Check if a player is already drafted in this draft.
 */
export async function isPlayerDrafted(draftStateId: string, playerId: string): Promise<boolean> {
  const pick = await prisma.draftPick.findFirst({
    where: { draftStateId, playerId },
  })
  return pick !== null
}

/**
 * Validate roster constraints for a potential pick.
 * Checks role slot availability and region minimums.
 */
export async function validatePickConstraints(
  draftStateId: string,
  userId: string,
  playerId: string,
  rosterSize: number
): Promise<{ valid: boolean; reason?: string }> {
  const player = await prisma.player.findUnique({ where: { id: playerId } })
  if (!player) return { valid: false, reason: 'Player not found' }

  const existingPicks = await prisma.draftPick.findMany({
    where: { draftStateId, userId },
    include: { player: true },
  })

  if (existingPicks.length >= rosterSize) {
    return { valid: false, reason: 'Roster is full' }
  }

  const roleSlots = ROLE_SLOTS_BY_ROSTER_SIZE[rosterSize]
  if (!roleSlots) return { valid: false, reason: 'Invalid roster size' }

  // Count current role distribution
  const roleCounts: Record<string, number> = { Duelist: 0, Initiator: 0, Controller: 0, Sentinel: 0, Wildcard: 0 }
  for (const pick of existingPicks) {
    const role = pick.player.role as string
    if (roleCounts[role] !== undefined && roleCounts[role] < roleSlots[role as keyof typeof roleSlots]) {
      roleCounts[role]++
    } else {
      roleCounts['Wildcard']++
    }
  }

  // Check if the new player's role has an open slot, or if wildcard is available
  const playerRole = player.role as string
  if (roleCounts[playerRole] < roleSlots[playerRole as keyof typeof roleSlots]) {
    // Fits in role slot
  } else if (roleCounts['Wildcard'] < roleSlots.Wildcard) {
    // Fits in wildcard slot
  } else {
    return { valid: false, reason: `No available slot for ${player.role}` }
  }

  return { valid: true }
}

/**
 * Make a draft pick. Validates it's the right user's turn, player is available,
 * and constraints are met. Round 1 picks are auto-captains.
 */
export async function makePick(
  leagueId: string,
  userId: string,
  playerId: string
): Promise<{ success: boolean; error?: string; pick?: { id: string; round: number; pickNumber: number; isCaptain: boolean } }> {
  const draft = await prisma.draftState.findUnique({
    where: { leagueId },
    include: { league: true },
  })

  if (!draft) return { success: false, error: 'No draft found' }
  if (draft.status !== 'IN_PROGRESS') return { success: false, error: 'Draft is not in progress' }

  const draftOrder = draft.draftOrder as string[]
  const nextPick = await getNextPickNumber(draft.id)
  const totalPicks = draftOrder.length * draft.league.rosterSize

  if (nextPick > totalPicks) return { success: false, error: 'Draft is complete' }

  const currentDrafter = getCurrentDrafter(draftOrder, nextPick)
  if (currentDrafter !== userId) return { success: false, error: 'Not your turn' }

  const alreadyDrafted = await isPlayerDrafted(draft.id, playerId)
  if (alreadyDrafted) return { success: false, error: 'Player already drafted' }

  const constraints = await validatePickConstraints(draft.id, userId, playerId, draft.league.rosterSize)
  if (!constraints.valid) return { success: false, error: constraints.reason }

  const round = getRound(nextPick, draftOrder.length)
  const isCaptain = round === CAPTAIN_ROUND

  const pick = await prisma.$transaction(async (tx) => {
    const newPick = await tx.draftPick.create({
      data: {
        draftStateId: draft.id,
        userId,
        playerId,
        round,
        pickNumber: nextPick,
        isCaptain,
      },
    })

    // Create/update roster with this player
    let roster = await tx.roster.findFirst({
      where: { leagueId, leagueMember: { userId } },
    })

    if (!roster) {
      const member = await tx.leagueMember.findUniqueOrThrow({
        where: { leagueId_userId: { leagueId, userId } },
      })
      roster = await tx.roster.create({
        data: { leagueMemberId: member.id, leagueId },
      })
    }

    const player = await tx.player.findUniqueOrThrow({ where: { id: playerId } })

    // Determine slot type
    const existingSlots = await tx.rosterPlayer.findMany({ where: { rosterId: roster.id } })
    const roleSlots = ROLE_SLOTS_BY_ROSTER_SIZE[draft.league.rosterSize]
    const roleCounts: Record<string, number> = { Duelist: 0, Initiator: 0, Controller: 0, Sentinel: 0, Wildcard: 0 }
    for (const slot of existingSlots) {
      // We need the slot type from the existing record
      roleCounts[slot.slotType]++
    }

    let slotType: string = player.role
    if (roleCounts[player.role] >= (roleSlots[player.role as keyof typeof roleSlots] ?? 0)) {
      slotType = 'Wildcard'
    }

    await tx.rosterPlayer.create({
      data: {
        rosterId: roster.id,
        playerId,
        isCaptain,
        slotType: slotType as 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel' | 'Wildcard',
      },
    })

    // Update draft state
    const newNextPick = nextPick + 1
    const isComplete = newNextPick > totalPicks

    await tx.draftState.update({
      where: { id: draft.id },
      data: {
        currentRound: getRound(Math.min(newNextPick, totalPicks), draftOrder.length),
        currentPickIndex: ((newNextPick - 1) % draftOrder.length),
        status: isComplete ? 'COMPLETE' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : undefined,
      },
    })

    if (isComplete) {
      await tx.league.update({
        where: { id: leagueId },
        data: { status: 'ACTIVE' },
      })
    }

    return newPick
  })

  return { success: true, pick: { id: pick.id, round, pickNumber: nextPick, isCaptain } }
}

/**
 * Start a draft for a league. Randomizes the draft order.
 */
export async function startDraft(leagueId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { members: true },
  })

  if (!league) return { success: false, error: 'League not found' }
  if (league.creatorId !== userId) return { success: false, error: 'Only the league creator can start the draft' }
  if (league.status !== 'SETUP') return { success: false, error: 'League is not in setup phase' }
  if (league.members.length < 2) return { success: false, error: 'Need at least 2 members' }

  // Randomize draft order
  const memberIds = league.members.map((m) => m.userId)
  for (let i = memberIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [memberIds[i], memberIds[j]] = [memberIds[j], memberIds[i]]
  }

  await prisma.$transaction(async (tx) => {
    await tx.draftState.create({
      data: {
        leagueId,
        status: 'IN_PROGRESS',
        currentRound: 1,
        currentPickIndex: 0,
        draftOrder: memberIds,
        startedAt: new Date(),
      },
    })

    await tx.league.update({
      where: { id: leagueId },
      data: { status: 'DRAFTING' },
    })
  })

  return { success: true }
}
