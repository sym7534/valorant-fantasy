import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { calculateBaseScore } from '@/src/lib/game-config'

// GET /api/players/[playerId]/stats — detailed stats with weekly breakdown
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { playerId } = await params

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        matchStats: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const stats = player.matchStats
    const totalMatches = stats.length

    const aggregated = stats.reduce(
      (acc, s) => ({
        kills: acc.kills + s.kills,
        deaths: acc.deaths + s.deaths,
        assists: acc.assists + s.assists,
        firstKills: acc.firstKills + s.firstKills,
        firstDeaths: acc.firstDeaths + s.firstDeaths,
        roundsWon: acc.roundsWon + s.roundsWon,
        roundsLost: acc.roundsLost + s.roundsLost,
        adr: acc.adr + s.adr,
        acs: acc.acs + s.acs,
        rating: acc.rating + s.rating,
      }),
      { kills: 0, deaths: 0, assists: 0, firstKills: 0, firstDeaths: 0, roundsWon: 0, roundsLost: 0, adr: 0, acs: 0, rating: 0 }
    )

    const avg = totalMatches > 0
      ? {
          kills: +(aggregated.kills / totalMatches).toFixed(1),
          deaths: +(aggregated.deaths / totalMatches).toFixed(1),
          assists: +(aggregated.assists / totalMatches).toFixed(1),
          firstKills: +(aggregated.firstKills / totalMatches).toFixed(1),
          firstDeaths: +(aggregated.firstDeaths / totalMatches).toFixed(1),
          adr: +(aggregated.adr / totalMatches).toFixed(1),
          acs: +(aggregated.acs / totalMatches).toFixed(1),
          rating: +(aggregated.rating / totalMatches).toFixed(2),
          kd: +(aggregated.kills / Math.max(aggregated.deaths, 1)).toFixed(2),
        }
      : null

    const matchDetails = stats.map((s) => {
      const fantasyPoints = calculateBaseScore({
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        firstKills: s.firstKills,
        firstDeaths: s.firstDeaths,
        roundsWon: s.roundsWon,
        roundsLost: s.roundsLost,
        adr: s.adr,
      })

      return {
        id: s.id,
        externalMatchId: s.externalMatchId,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
        firstKills: s.firstKills,
        firstDeaths: s.firstDeaths,
        roundsWon: s.roundsWon,
        roundsLost: s.roundsLost,
        adr: s.adr,
        acs: s.acs,
        rating: s.rating,
        fantasyPoints: +fantasyPoints.toFixed(1),
        date: s.createdAt.toISOString(),
      }
    })

    const totalFantasyPoints = matchDetails.reduce((sum, m) => sum + m.fantasyPoints, 0)

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        team: player.team,
        region: player.region,
        role: player.role,
        imageUrl: player.imageUrl,
      },
      totals: {
        matches: totalMatches,
        ...aggregated,
        fantasyPoints: +totalFantasyPoints.toFixed(1),
      },
      averages: avg,
      matches: matchDetails,
    })
  } catch (err) {
    console.error('GET players/[playerId]/stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
