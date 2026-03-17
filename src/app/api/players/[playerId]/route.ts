import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { calculateBaseScore } from '@/src/lib/game-config'
import type { PlayerDetailResponse, PlayerMatchStatEntry, PlayerAverageStats } from '@/src/lib/api-types'

// GET /api/players/[playerId] — get player details + match stats history
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
): Promise<NextResponse<PlayerDetailResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { playerId } = await params

  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        matchStats: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const matchStats: PlayerMatchStatEntry[] = player.matchStats.map((ms) => ({
      id: ms.id,
      externalMatchId: ms.externalMatchId,
      kills: ms.kills,
      deaths: ms.deaths,
      assists: ms.assists,
      firstKills: ms.firstKills,
      firstDeaths: ms.firstDeaths,
      roundsWon: ms.roundsWon,
      roundsLost: ms.roundsLost,
      adr: ms.adr,
      acs: ms.acs,
      rating: ms.rating,
      hsPercent: ms.hsPercent,
      kast: ms.kast,
      createdAt: ms.createdAt.toISOString(),
    }))

    let averageStats: PlayerAverageStats | null = null
    if (matchStats.length > 0) {
      const count = matchStats.length
      const totals = matchStats.reduce(
        (acc, ms) => ({
          kills: acc.kills + ms.kills,
          deaths: acc.deaths + ms.deaths,
          assists: acc.assists + ms.assists,
          firstKills: acc.firstKills + ms.firstKills,
          firstDeaths: acc.firstDeaths + ms.firstDeaths,
          adr: acc.adr + ms.adr,
          acs: acc.acs + ms.acs,
          rating: acc.rating + ms.rating,
        }),
        { kills: 0, deaths: 0, assists: 0, firstKills: 0, firstDeaths: 0, adr: 0, acs: 0, rating: 0 }
      )

      const avgKills = totals.kills / count
      const avgDeaths = totals.deaths / count
      const avgAssists = totals.assists / count
      const avgFirstKills = totals.firstKills / count
      const avgFirstDeaths = totals.firstDeaths / count
      const avgAdr = totals.adr / count

      const avgFantasyPoints = calculateBaseScore({
        kills: avgKills,
        deaths: avgDeaths,
        assists: avgAssists,
        firstKills: avgFirstKills,
        firstDeaths: avgFirstDeaths,
        roundsWon: 0,
        roundsLost: 0,
        adr: avgAdr,
      })

      averageStats = {
        kills: Math.round(avgKills * 10) / 10,
        deaths: Math.round(avgDeaths * 10) / 10,
        assists: Math.round(avgAssists * 10) / 10,
        firstKills: Math.round(avgFirstKills * 10) / 10,
        firstDeaths: Math.round(avgFirstDeaths * 10) / 10,
        adr: Math.round(avgAdr * 10) / 10,
        acs: Math.round((totals.acs / count) * 10) / 10,
        rating: Math.round((totals.rating / count) * 100) / 100,
        avgFantasyPoints: Math.round(avgFantasyPoints * 10) / 10,
      }
    }

    const response: PlayerDetailResponse = {
      player: {
        id: player.id,
        name: player.name,
        team: player.team,
        region: player.region as PlayerDetailResponse['player']['region'],
        role: player.role as PlayerDetailResponse['player']['role'],
        imageUrl: player.imageUrl,
        matchStats,
        averageStats,
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/players/[playerId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
