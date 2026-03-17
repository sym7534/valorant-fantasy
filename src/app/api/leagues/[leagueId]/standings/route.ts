import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import type {
  StandingsResponse,
  StandingEntry,
  WeeklyScoreEntry,
  PlayerScoreBreakdown,
} from '@/src/lib/api-types'

// GET /api/leagues/[leagueId]/standings — get league standings
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<StandingsResponse | { error: string }>> {
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

    // Get all members with their weekly scores
    const members = await prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        weeklyScores: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    // Build standings
    const standings: StandingEntry[] = members.map((m) => {
      const totalPoints = m.weeklyScores.reduce((sum, ws) => sum + ws.totalPoints, 0)

      const weeklyScores: WeeklyScoreEntry[] = m.weeklyScores.map((ws) => {
        const breakdown = (ws.breakdown as PlayerScoreBreakdown[] | null) ?? []
        return {
          weekNumber: ws.weekNumber,
          totalPoints: ws.totalPoints,
          breakdown,
        }
      })

      return {
        rank: 0, // Will be set after sorting
        userId: m.userId,
        user: {
          id: m.user.id,
          name: m.user.name,
          image: m.user.image,
        },
        totalPoints,
        weeklyScores,
      }
    })

    // Sort by total points descending and assign ranks
    standings.sort((a, b) => b.totalPoints - a.totalPoints)
    standings.forEach((s, i) => {
      s.rank = i + 1
    })

    const response: StandingsResponse = {
      leagueId,
      standings,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/leagues/[leagueId]/standings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
