import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
import { REGIONS, PLAYER_ROLES } from '@/src/lib/game-config'
import type { PlayersListResponse, PlayerSummary, PaginationMeta } from '@/src/lib/api-types'

// GET /api/players — list players with filters
export async function GET(
  request: NextRequest
): Promise<NextResponse<PlayersListResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams

    const region = searchParams.get('region')
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build where clause
    const where: Record<string, unknown> = {}

    if (region && REGIONS.includes(region as typeof REGIONS[number])) {
      where.region = region
    }

    if (role && PLAYER_ROLES.includes(role as typeof PLAYER_ROLES[number])) {
      where.roles = { has: role }
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { team: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const [total, rawPlayers] = await Promise.all([
      prisma.player.count({ where }),
      prisma.player.findMany({
        where,
        select: {
          id: true,
          name: true,
          team: true,
          region: true,
          roles: true,
          imageUrl: true,
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const players: PlayerSummary[] = rawPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      region: p.region as PlayerSummary['region'],
      roles: p.roles as PlayerSummary['roles'],
      imageUrl: p.imageUrl,
    }))

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }

    const response: PlayersListResponse = { players, pagination }
    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/players error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
