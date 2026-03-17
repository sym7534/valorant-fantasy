import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

// GET /api/leagues/[leagueId]/schedule — match schedule for roster players
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId } = await params

    const member = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
      include: {
        roster: {
          include: {
            rosterPlayers: {
              include: { player: { select: { name: true, team: true, region: true } } },
            },
          },
        },
      },
    })
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    const rosterTeams = member.roster?.rosterPlayers.map((rp) => rp.player.team) ?? []
    const uniqueTeams = [...new Set(rosterTeams)]

    // Schedule data would come from an external source or be seeded.
    // For MVP, return a placeholder structure.
    return NextResponse.json({
      leagueId,
      rosterTeams: uniqueTeams,
      weeks: [],
    })
  } catch (err) {
    console.error('GET schedule error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
