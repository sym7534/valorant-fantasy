import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { prisma } from '@/src/lib/prisma'
// BLOCKED: Waiting on Lead Agent — replace with import from game-config
import {
  MIN_LEAGUE_SIZE,
  MAX_LEAGUE_SIZE,
  MIN_ROSTER_SIZE,
  MAX_ROSTER_SIZE,
  DRAFT_TIMER_OPTIONS,
  DEFAULT_DRAFT_TIMER,
  LEAGUE_NAME_MAX_LENGTH,
  INVITE_CODE_LENGTH,
} from '@/src/lib/game-config'
import type {
  LeagueListResponse,
  LeagueCreateRequest,
  LeagueCreateResponse,
} from '@/src/lib/api-types'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET /api/leagues — list all leagues the current user is a member of
export async function GET(): Promise<NextResponse<LeagueListResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId: session.user.id },
      include: {
        league: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const leagues = memberships.map((m) => ({
      id: m.league.id,
      name: m.league.name,
      status: m.league.status as LeagueListResponse['leagues'][number]['status'],
      memberCount: m.league._count.members,
      rosterSize: m.league.rosterSize,
      creatorId: m.league.creatorId,
      createdAt: m.league.createdAt.toISOString(),
    }))

    return NextResponse.json({ leagues })
  } catch (err) {
    console.error('GET /api/leagues error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leagues — create a new league
export async function POST(
  request: NextRequest
): Promise<NextResponse<LeagueCreateResponse | { error: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Partial<LeagueCreateRequest>

    // Validate name
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'League name is required' }, { status: 400 })
    }
    if (body.name.trim().length > LEAGUE_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `League name must be at most ${LEAGUE_NAME_MAX_LENGTH} characters` },
        { status: 400 }
      )
    }

    // Validate roster size
    const rosterSize = body.rosterSize ?? MAX_ROSTER_SIZE
    if (
      typeof rosterSize !== 'number' ||
      !Number.isInteger(rosterSize) ||
      rosterSize < MIN_ROSTER_SIZE ||
      rosterSize > MAX_ROSTER_SIZE
    ) {
      return NextResponse.json(
        { error: `Roster size must be between ${MIN_ROSTER_SIZE} and ${MAX_ROSTER_SIZE}` },
        { status: 400 }
      )
    }

    // Validate draft pick time
    const draftPickTime = body.draftPickTime ?? DEFAULT_DRAFT_TIMER
    if (typeof draftPickTime !== 'number' || !DRAFT_TIMER_OPTIONS.includes(draftPickTime)) {
      return NextResponse.json(
        { error: `Draft pick time must be one of: ${DRAFT_TIMER_OPTIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate a unique invite code
    let inviteCode = generateInviteCode()
    let codeExists = true
    while (codeExists) {
      const existing = await prisma.league.findUnique({ where: { inviteCode } })
      if (!existing) {
        codeExists = false
      } else {
        inviteCode = generateInviteCode()
      }
    }

    // Create league and add creator as first member in a transaction
    const league = await prisma.$transaction(async (tx) => {
      const newLeague = await tx.league.create({
        data: {
          name: body.name!.trim(),
          inviteCode,
          status: 'SETUP',
          rosterSize,
          draftPickTime,
          creatorId: session.user!.id,
        },
      })

      await tx.leagueMember.create({
        data: {
          leagueId: newLeague.id,
          userId: session.user!.id,
        },
      })

      return tx.league.findUniqueOrThrow({
        where: { id: newLeague.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      })
    })

    const response: LeagueCreateResponse = {
      league: {
        id: league.id,
        name: league.name,
        inviteCode: league.inviteCode,
        status: league.status as LeagueCreateResponse['league']['status'],
        rosterSize: league.rosterSize,
        draftPickTime: league.draftPickTime,
        creatorId: league.creatorId,
        createdAt: league.createdAt.toISOString(),
        updatedAt: league.updatedAt.toISOString(),
        members: league.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          user: {
            id: m.user.id,
            name: m.user.name,
            image: m.user.image,
          },
          joinedAt: m.joinedAt.toISOString(),
        })),
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    console.error('POST /api/leagues error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
