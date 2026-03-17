import type { Server as SocketIOServer, Socket } from 'socket.io'
import { prisma } from '@/src/lib/prisma'
import {
  CAPTAIN_ROUND,
  ROLE_SLOTS_BY_ROSTER_SIZE,
} from '@/src/lib/game-config'
import type {
  SocketDraftJoinPayload,
  SocketDraftPickPayload,
  SocketDraftStatePayload,
  SocketDraftPickedPayload,
  SocketDraftTurnPayload,
  SocketDraftTimerPayload,
  SocketDraftCompletePayload,
  SocketDraftErrorPayload,
  DraftPickEntry,
} from '@/src/lib/api-types'

// Track active draft timers per league
const draftTimers = new Map<string, NodeJS.Timeout>()
const draftTimerCountdowns = new Map<string, number>()

function getCurrentPickerUserId(draftOrder: string[], round: number, pickIndex: number): string {
  const isEvenRound = round % 2 === 0
  if (isEvenRound) {
    return draftOrder[draftOrder.length - 1 - pickIndex]
  }
  return draftOrder[pickIndex]
}

function determineSlotType(
  playerRole: string,
  existingPicks: Array<{ role: string; slotType: string }>,
  rosterSize: number
): string {
  const slotConfig = ROLE_SLOTS_BY_ROSTER_SIZE[rosterSize]
  if (!slotConfig) return 'Wildcard'

  const filledSlots: Record<string, number> = {}
  for (const pick of existingPicks) {
    filledSlots[pick.slotType] = (filledSlots[pick.slotType] || 0) + 1
  }

  const roleSlotCount = slotConfig[playerRole as keyof typeof slotConfig] ?? 0
  const roleFilled = filledSlots[playerRole] ?? 0
  if (roleFilled < roleSlotCount) {
    return playerRole
  }

  const wildcardCount = slotConfig['Wildcard'] ?? 0
  const wildcardFilled = filledSlots['Wildcard'] ?? 0
  if (wildcardFilled < wildcardCount) {
    return 'Wildcard'
  }

  for (const [slot, count] of Object.entries(slotConfig)) {
    const filled = filledSlots[slot] ?? 0
    if (filled < count) {
      return slot
    }
  }

  return 'Wildcard'
}

async function fetchDraftState(leagueId: string): Promise<SocketDraftStatePayload | null> {
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

  if (!draftState) return null

  const picks: DraftPickEntry[] = draftState.picks.map((p) => ({
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

  return {
    id: draftState.id,
    leagueId: draftState.leagueId,
    status: draftState.status as SocketDraftStatePayload['status'],
    currentRound: draftState.currentRound,
    currentPickIndex: draftState.currentPickIndex,
    draftOrder: draftState.draftOrder as string[],
    picks,
    startedAt: draftState.startedAt?.toISOString() ?? null,
    completedAt: draftState.completedAt?.toISOString() ?? null,
    timeRemaining: draftTimerCountdowns.get(leagueId) ?? null,
  }
}

function clearDraftTimer(leagueId: string): void {
  const existing = draftTimers.get(leagueId)
  if (existing) {
    clearInterval(existing)
    draftTimers.delete(leagueId)
  }
  draftTimerCountdowns.delete(leagueId)
}

function startDraftTimer(io: SocketIOServer, leagueId: string, draftPickTime: number): void {
  clearDraftTimer(leagueId)

  draftTimerCountdowns.set(leagueId, draftPickTime)

  const interval = setInterval(async () => {
    const remaining = (draftTimerCountdowns.get(leagueId) ?? 0) - 1
    draftTimerCountdowns.set(leagueId, remaining)

    const timerPayload: SocketDraftTimerPayload = { secondsRemaining: remaining }
    io.to(`draft:${leagueId}`).emit('draft:timer', timerPayload)

    if (remaining <= 0) {
      clearDraftTimer(leagueId)
      // Auto-pick on timer expiry
      await handleAutoPick(io, leagueId)
    }
  }, 1000)

  draftTimers.set(leagueId, interval)
}

async function handleAutoPick(io: SocketIOServer, leagueId: string): Promise<void> {
  try {
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

    if (!draftState || draftState.status !== 'IN_PROGRESS') return

    const draftOrder = draftState.draftOrder as string[]
    const currentUserId = getCurrentPickerUserId(
      draftOrder,
      draftState.currentRound,
      draftState.currentPickIndex
    )

    const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } })

    // Get all already-drafted player IDs
    const draftedPlayerIds = new Set(draftState.picks.map((p) => p.playerId))

    // Pick a random available player
    const availablePlayers = await prisma.player.findMany({
      where: {
        id: { notIn: Array.from(draftedPlayerIds) },
      },
      take: 1,
    })

    if (availablePlayers.length === 0) return

    const player = availablePlayers[0]
    const isCaptain = draftState.currentRound === CAPTAIN_ROUND

    // Get user's existing picks for slot type determination
    const userPicks = draftState.picks
      .filter((p) => p.userId === currentUserId)
      .map((p) => ({ role: p.player.role, slotType: p.slotType ?? 'Wildcard' }))

    const slotType = determineSlotType(player.role, userPicks, league.rosterSize)

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

    // Get membership for roster creation
    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId: currentUserId,
        },
      },
    })

    if (!membership) return

    const newPick = await prisma.$transaction(async (tx) => {
      const pick = await tx.draftPick.create({
        data: {
          draftStateId: draftState.id,
          userId: currentUserId,
          playerId: player.id,
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

      await tx.rosterPlayer.create({
        data: {
          rosterId: roster.id,
          playerId: player.id,
          isCaptain,
          slotType,
        },
      })

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

      return pick
    })

    // Broadcast pick
    const pickedPayload: SocketDraftPickedPayload = {
      pick: {
        id: newPick.id,
        userId: newPick.userId,
        user: { id: newPick.user.id, name: newPick.user.name, image: newPick.user.image },
        playerId: newPick.playerId,
        player: {
          id: newPick.player.id,
          name: newPick.player.name,
          team: newPick.player.team,
          region: newPick.player.region as DraftPickEntry['player']['region'],
          role: newPick.player.role as DraftPickEntry['player']['role'],
          imageUrl: newPick.player.imageUrl,
        },
        round: newPick.round,
        pickNumber: newPick.pickNumber,
        isCaptain: newPick.isCaptain,
        pickedAt: newPick.pickedAt.toISOString(),
      },
    }
    io.to(`draft:${leagueId}`).emit('draft:picked', pickedPayload)

    if (draftComplete) {
      clearDraftTimer(leagueId)
      const completePayload: SocketDraftCompletePayload = { leagueId }
      io.to(`draft:${leagueId}`).emit('draft:complete', completePayload)
    } else {
      // Broadcast updated draft state and new turn
      const updatedState = await fetchDraftState(leagueId)
      if (updatedState) {
        io.to(`draft:${leagueId}`).emit('draft:state', updatedState)

        const newDraftOrder = updatedState.draftOrder
        const nextPickerUserId = getCurrentPickerUserId(
          newDraftOrder,
          updatedState.currentRound,
          updatedState.currentPickIndex
        )

        const turnPayload: SocketDraftTurnPayload = {
          userId: nextPickerUserId,
          round: updatedState.currentRound,
          pickNumber: updatedState.currentPickIndex + 1,
          timeRemaining: league.draftPickTime,
        }
        io.to(`draft:${leagueId}`).emit('draft:turn', turnPayload)

        // Restart timer for next pick
        startDraftTimer(io, leagueId, league.draftPickTime)
      }
    }
  } catch (err) {
    console.error('Auto-pick error:', err)
  }
}

export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('draft:join', async (payload: SocketDraftJoinPayload) => {
      const { leagueId } = payload

      if (!leagueId || typeof leagueId !== 'string') {
        const errorPayload: SocketDraftErrorPayload = { message: 'leagueId is required' }
        socket.emit('draft:error', errorPayload)
        return
      }

      // Join the draft room
      socket.join(`draft:${leagueId}`)

      // Send current draft state
      const state = await fetchDraftState(leagueId)
      if (state) {
        socket.emit('draft:state', state)

        // If draft is in progress, send current turn info
        if (state.status === 'IN_PROGRESS') {
          const league = await prisma.league.findUnique({ where: { id: leagueId } })
          if (league) {
            const currentPickerUserId = getCurrentPickerUserId(
              state.draftOrder,
              state.currentRound,
              state.currentPickIndex
            )

            const turnPayload: SocketDraftTurnPayload = {
              userId: currentPickerUserId,
              round: state.currentRound,
              pickNumber: state.currentPickIndex + 1,
              timeRemaining: draftTimerCountdowns.get(leagueId) ?? league.draftPickTime,
            }
            socket.emit('draft:turn', turnPayload)

            // Start timer if not already running
            if (!draftTimers.has(leagueId)) {
              startDraftTimer(io, leagueId, league.draftPickTime)
            }
          }
        }
      } else {
        const errorPayload: SocketDraftErrorPayload = { message: 'Draft not found for this league' }
        socket.emit('draft:error', errorPayload)
      }
    })

    socket.on('draft:pick', async (payload: SocketDraftPickPayload) => {
      const { leagueId, playerId } = payload

      if (!leagueId || !playerId) {
        const errorPayload: SocketDraftErrorPayload = { message: 'leagueId and playerId are required' }
        socket.emit('draft:error', errorPayload)
        return
      }

      try {
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

        if (!draftState || draftState.status !== 'IN_PROGRESS') {
          const errorPayload: SocketDraftErrorPayload = { message: 'Draft is not in progress' }
          socket.emit('draft:error', errorPayload)
          return
        }

        // NOTE: Socket.io doesn't carry session by default.
        // In a production app, we would authenticate the socket connection.
        // For now, we rely on the REST API for authenticated picks.
        // The socket pick handler is here for real-time broadcasting.

        // After a pick is made via REST API, the API route should
        // trigger socket broadcasts. This handler is primarily for
        // the auto-pick mechanism and state synchronization.

        // Check if player was already drafted
        const alreadyDrafted = draftState.picks.some((p) => p.playerId === playerId)
        if (alreadyDrafted) {
          const errorPayload: SocketDraftErrorPayload = { message: 'Player has already been drafted' }
          socket.emit('draft:error', errorPayload)
          return
        }

        const player = await prisma.player.findUnique({ where: { id: playerId } })
        if (!player) {
          const errorPayload: SocketDraftErrorPayload = { message: 'Player not found' }
          socket.emit('draft:error', errorPayload)
          return
        }

        const draftOrder = draftState.draftOrder as string[]
        const currentUserId = getCurrentPickerUserId(
          draftOrder,
          draftState.currentRound,
          draftState.currentPickIndex
        )

        const league = await prisma.league.findUniqueOrThrow({ where: { id: leagueId } })
        const isCaptain = draftState.currentRound === CAPTAIN_ROUND

        const userPicks = draftState.picks
          .filter((p) => p.userId === currentUserId)
          .map((p) => ({ role: p.player.role, slotType: p.slotType ?? 'Wildcard' }))

        const slotType = determineSlotType(player.role, userPicks, league.rosterSize)

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

        const membership = await prisma.leagueMember.findUnique({
          where: {
            leagueId_userId: {
              leagueId,
              userId: currentUserId,
            },
          },
        })

        if (!membership) {
          const errorPayload: SocketDraftErrorPayload = { message: 'User is not a member of this league' }
          socket.emit('draft:error', errorPayload)
          return
        }

        const newPick = await prisma.$transaction(async (tx) => {
          const pick = await tx.draftPick.create({
            data: {
              draftStateId: draftState.id,
              userId: currentUserId,
              playerId,
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

          await tx.rosterPlayer.create({
            data: {
              rosterId: roster.id,
              playerId,
              isCaptain,
              slotType,
            },
          })

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

          return pick
        })

        // Broadcast the pick
        const pickedPayload: SocketDraftPickedPayload = {
          pick: {
            id: newPick.id,
            userId: newPick.userId,
            user: { id: newPick.user.id, name: newPick.user.name, image: newPick.user.image },
            playerId: newPick.playerId,
            player: {
              id: newPick.player.id,
              name: newPick.player.name,
              team: newPick.player.team,
              region: newPick.player.region as DraftPickEntry['player']['region'],
              role: newPick.player.role as DraftPickEntry['player']['role'],
              imageUrl: newPick.player.imageUrl,
            },
            round: newPick.round,
            pickNumber: newPick.pickNumber,
            isCaptain: newPick.isCaptain,
            pickedAt: newPick.pickedAt.toISOString(),
          },
        }
        io.to(`draft:${leagueId}`).emit('draft:picked', pickedPayload)

        if (draftComplete) {
          clearDraftTimer(leagueId)
          const completePayload: SocketDraftCompletePayload = { leagueId }
          io.to(`draft:${leagueId}`).emit('draft:complete', completePayload)
        } else {
          // Broadcast updated state and new turn
          const updatedState = await fetchDraftState(leagueId)
          if (updatedState) {
            io.to(`draft:${leagueId}`).emit('draft:state', updatedState)

            const newDraftOrder = updatedState.draftOrder
            const nextPickerUserId = getCurrentPickerUserId(
              newDraftOrder,
              updatedState.currentRound,
              updatedState.currentPickIndex
            )

            const turnPayload: SocketDraftTurnPayload = {
              userId: nextPickerUserId,
              round: updatedState.currentRound,
              pickNumber: updatedState.currentPickIndex + 1,
              timeRemaining: league.draftPickTime,
            }
            io.to(`draft:${leagueId}`).emit('draft:turn', turnPayload)

            // Restart timer
            startDraftTimer(io, leagueId, league.draftPickTime)
          }
        }
      } catch (err) {
        console.error('draft:pick error:', err)
        const errorPayload: SocketDraftErrorPayload = { message: 'Failed to process pick' }
        socket.emit('draft:error', errorPayload)
      }
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}
