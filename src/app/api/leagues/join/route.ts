import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { MAX_LEAGUE_SIZE } from '@/src/lib/game-config';
import type { LeagueJoinRequest, LeagueJoinResponse } from '@/src/lib/api-types';
import { loadLeagueDetail } from '@/src/server/league-service';

export async function POST(
  request: NextRequest
): Promise<NextResponse<LeagueJoinResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<LeagueJoinRequest>;
    const inviteCode = body.inviteCode?.trim().toUpperCase();

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const league = await prisma.league.findUnique({
      where: {
        inviteCode,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    if (league.archivedAt) {
      return NextResponse.json({ error: 'This league has been archived' }, { status: 400 });
    }

    if (league.status !== 'SETUP') {
      return NextResponse.json(
        { error: 'This league can no longer accept new members' },
        { status: 400 }
      );
    }

    if (league._count.members >= MAX_LEAGUE_SIZE) {
      return NextResponse.json({ error: 'This league is full' }, { status: 400 });
    }

    const existingMembership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already in this league' }, { status: 400 });
    }

    await prisma.leagueMember.create({
      data: {
        leagueId: league.id,
        userId,
      },
    });

    const detail = await loadLeagueDetail(league.id);
    if (!detail) {
      throw new Error('Failed to load joined league');
    }

    return NextResponse.json({
      league: detail,
    });
  } catch (error) {
    console.error('POST /api/leagues/join failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
