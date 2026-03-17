import { prisma } from '@/src/lib/prisma'
import {
  calculateBaseScore,
  applyMultiplier,
  CAPTAIN_MULTIPLIER,
  STAR_PLAYER_MULTIPLIER,
} from '@/src/lib/game-config'
import type { PlayerDesignation, PlayerMatchStats } from '@/src/lib/game-config'

interface PlayerScoreDetail {
  playerId: string
  playerName: string
  baseScore: number
  multiplier: number
  finalScore: number
  designation: PlayerDesignation
  stats: PlayerMatchStats
}

/**
 * Calculate weekly scores for all rosters in a league for a given week.
 * Looks at each roster's weekly lineup, computes fantasy points from match stats,
 * applies captain (2x) and star (3x) multipliers.
 */
export async function calculateWeeklyScores(
  leagueId: string,
  weekNumber: number
): Promise<{ memberId: string; totalPoints: number; breakdown: PlayerScoreDetail[] }[]> {
  const rosters = await prisma.roster.findMany({
    where: { leagueId },
    include: {
      leagueMember: true,
      weeklyLineups: {
        where: { weekNumber },
        include: {
          slots: {
            include: {
              rosterPlayer: {
                include: { player: { include: { matchStats: true } } },
              },
            },
          },
        },
      },
    },
  })

  const results: { memberId: string; totalPoints: number; breakdown: PlayerScoreDetail[] }[] = []

  for (const roster of rosters) {
    const lineup = roster.weeklyLineups[0]
    if (!lineup) {
      results.push({ memberId: roster.leagueMemberId, totalPoints: 0, breakdown: [] })
      continue
    }

    const breakdown: PlayerScoreDetail[] = []

    for (const slot of lineup.slots) {
      const rp = slot.rosterPlayer
      const player = rp.player
      const matchStats = player.matchStats

      // Sum all match stats for this week's period
      // For MVP, use all stats; in production, filter by date range for the week
      const aggregated: PlayerMatchStats = matchStats.reduce(
        (acc, s) => ({
          kills: acc.kills + s.kills,
          deaths: acc.deaths + s.deaths,
          assists: acc.assists + s.assists,
          firstKills: acc.firstKills + s.firstKills,
          firstDeaths: acc.firstDeaths + s.firstDeaths,
          roundsWon: acc.roundsWon + s.roundsWon,
          roundsLost: acc.roundsLost + s.roundsLost,
          adr: acc.adr + s.adr,
        }),
        { kills: 0, deaths: 0, assists: 0, firstKills: 0, firstDeaths: 0, roundsWon: 0, roundsLost: 0, adr: 0 }
      )

      if (matchStats.length > 0) {
        aggregated.adr = aggregated.adr / matchStats.length
      }

      const baseScore = calculateBaseScore(aggregated)

      let designation: PlayerDesignation = 'normal'
      if (slot.isStarPlayer) {
        designation = 'star'
      } else if (rp.isCaptain) {
        designation = 'captain'
      }

      const finalScore = applyMultiplier(baseScore, designation)

      breakdown.push({
        playerId: player.id,
        playerName: player.name,
        baseScore: +baseScore.toFixed(1),
        multiplier: designation === 'star' ? STAR_PLAYER_MULTIPLIER : designation === 'captain' ? CAPTAIN_MULTIPLIER : 1,
        finalScore: +finalScore.toFixed(1),
        designation,
        stats: aggregated,
      })
    }

    const totalPoints = breakdown.reduce((sum, p) => sum + p.finalScore, 0)

    results.push({
      memberId: roster.leagueMemberId,
      totalPoints: +totalPoints.toFixed(1),
      breakdown,
    })
  }

  return results
}

/**
 * Persist weekly scores to the database.
 */
export async function saveWeeklyScores(leagueId: string, weekNumber: number): Promise<void> {
  const scores = await calculateWeeklyScores(leagueId, weekNumber)

  await prisma.$transaction(
    scores.map((s) =>
      prisma.weeklyScore.upsert({
        where: {
          leagueMemberId_weekNumber: {
            leagueMemberId: s.memberId,
            weekNumber,
          },
        },
        create: {
          leagueMemberId: s.memberId,
          weekNumber,
          totalPoints: s.totalPoints,
          breakdown: s.breakdown as unknown as Record<string, unknown>,
        },
        update: {
          totalPoints: s.totalPoints,
          breakdown: s.breakdown as unknown as Record<string, unknown>,
        },
      })
    )
  )
}

/**
 * Get standings for a league — aggregates total scores across all weeks.
 */
export async function getStandings(leagueId: string): Promise<{
  rank: number
  memberId: string
  userId: string
  userName: string | null
  userImage: string | null
  totalPoints: number
  weeklyScores: { weekNumber: number; points: number }[]
}[]> {
  const members = await prisma.leagueMember.findMany({
    where: { leagueId },
    include: {
      user: { select: { id: true, name: true, image: true } },
      weeklyScores: { orderBy: { weekNumber: 'asc' } },
    },
  })

  const standings = members.map((m) => {
    const totalPoints = m.weeklyScores.reduce((sum, ws) => sum + ws.totalPoints, 0)
    return {
      rank: 0,
      memberId: m.id,
      userId: m.userId,
      userName: m.user.name,
      userImage: m.user.image,
      totalPoints: +totalPoints.toFixed(1),
      weeklyScores: m.weeklyScores.map((ws) => ({
        weekNumber: ws.weekNumber,
        points: ws.totalPoints,
      })),
    }
  })

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((s, i) => { s.rank = i + 1 })

  return standings
}
