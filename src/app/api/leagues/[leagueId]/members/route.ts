import { NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { leagueId } = await params
    const membership = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: session.user.id } },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 })
    }

    const members = await prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        roster: { include: { _count: { select: { rosterPlayers: true } } } },
      },
      orderBy: { joinedAt: 'asc' },
    })

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { draft: { select: { draftOrder: true } } },
    })

    const draftOrder = (league?.draft?.draftOrder as string[]) ?? []

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        user: m.user,
        joinedAt: m.joinedAt.toISOString(),
        draftOrder: draftOrder.indexOf(m.userId),
        rosterPlayerCount: m.roster?._count?.rosterPlayers ?? 0,
      })),
    })
  } catch (err) {
    console.error('GET /api/leagues/[leagueId]/members error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
