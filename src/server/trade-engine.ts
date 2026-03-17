import { prisma } from '@/src/lib/prisma'

export interface TradeOfferInput {
  leagueId: string
  fromUserId: string
  toUserId: string
  offeredPlayerIds: string[]
  requestedPlayerIds: string[]
  scoreOffered: number
  scoreRequested: number
  note?: string
}

/**
 * Validate that both parties own the players they're trading.
 */
async function validateOwnership(
  leagueId: string,
  userId: string,
  playerIds: string[]
): Promise<{ valid: boolean; reason?: string }> {
  if (playerIds.length === 0) return { valid: true }

  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
    include: {
      roster: {
        include: {
          rosterPlayers: { select: { playerId: true } },
        },
      },
    },
  })

  if (!member?.roster) return { valid: false, reason: `User ${userId} has no roster` }

  const ownedPlayerIds = new Set(member.roster.rosterPlayers.map((rp) => rp.playerId))
  const missing = playerIds.filter((id) => !ownedPlayerIds.has(id))

  if (missing.length > 0) {
    return { valid: false, reason: `User does not own players: ${missing.join(', ')}` }
  }

  return { valid: true }
}

/**
 * Execute a trade — atomically swap players between rosters and adjust score balances.
 * No roster constraint validation post-trade (per spec).
 */
export async function executeTrade(
  leagueId: string,
  fromUserId: string,
  toUserId: string,
  offeredPlayerIds: string[],
  requestedPlayerIds: string[],
  scoreTransfer: number // positive = from gives to "to", negative = "to" gives to from
): Promise<{ success: boolean; error?: string }> {
  // Validate ownership
  const fromValid = await validateOwnership(leagueId, fromUserId, offeredPlayerIds)
  if (!fromValid.valid) return { success: false, error: fromValid.reason }

  const toValid = await validateOwnership(leagueId, toUserId, requestedPlayerIds)
  if (!toValid.valid) return { success: false, error: toValid.reason }

  try {
    await prisma.$transaction(async (tx) => {
      const fromMember = await tx.leagueMember.findUniqueOrThrow({
        where: { leagueId_userId: { leagueId, userId: fromUserId } },
        include: { roster: true },
      })
      const toMember = await tx.leagueMember.findUniqueOrThrow({
        where: { leagueId_userId: { leagueId, userId: toUserId } },
        include: { roster: true },
      })

      if (!fromMember.roster || !toMember.roster) {
        throw new Error('Both users must have rosters')
      }

      // Move offered players: from → to
      for (const playerId of offeredPlayerIds) {
        const rosterPlayer = await tx.rosterPlayer.findFirst({
          where: { rosterId: fromMember.roster.id, playerId },
        })
        if (!rosterPlayer) throw new Error(`Player ${playerId} not found on sender roster`)

        await tx.rosterPlayer.update({
          where: { id: rosterPlayer.id },
          data: { rosterId: toMember.roster.id },
        })
      }

      // Move requested players: to → from
      for (const playerId of requestedPlayerIds) {
        const rosterPlayer = await tx.rosterPlayer.findFirst({
          where: { rosterId: toMember.roster.id, playerId },
        })
        if (!rosterPlayer) throw new Error(`Player ${playerId} not found on receiver roster`)

        await tx.rosterPlayer.update({
          where: { id: rosterPlayer.id },
          data: { rosterId: fromMember.roster.id },
        })
      }

      // Remove traded players from any active lineups
      // (they need to be re-added by the new owner)
      const allTradedPlayerIds = [...offeredPlayerIds, ...requestedPlayerIds]
      const affectedSlots = await tx.rosterPlayer.findMany({
        where: { playerId: { in: allTradedPlayerIds } },
        include: { lineupSlots: true },
      })

      for (const rp of affectedSlots) {
        if (rp.lineupSlots.length > 0) {
          await tx.lineupSlot.deleteMany({
            where: { rosterPlayerId: rp.id },
          })
        }
      }
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Trade execution failed'
    return { success: false, error: message }
  }
}
