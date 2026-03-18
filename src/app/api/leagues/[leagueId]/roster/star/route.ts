import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { STAR_PLAYER_COOLDOWN_WEEKS } from '@/src/lib/game-config';
import type { RosterStarRequest, RosterStarResponse } from '@/src/lib/api-types';
import { buildRosterResponse, checkAndAutoLockWeek, ensureLeagueWeek } from '@/src/server/roster-service';
import { saveLeagueWeekScores } from '@/src/server/scoring-engine';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterStarResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const body = (await request.json()) as Partial<RosterStarRequest>;

    if (!body.playerId || typeof body.playerId !== 'string') {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const membership = await prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this league' }, { status: 403 });
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        status: true,
        currentWeek: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Star players can only be set once the draft is complete' },
        { status: 400 }
      );
    }

    const weekNumber = body.weekNumber ?? league.currentWeek;
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      return NextResponse.json({ error: 'weekNumber must be a positive integer' }, { status: 400 });
    }

    await ensureLeagueWeek(leagueId, weekNumber);
    await checkAndAutoLockWeek(leagueId, weekNumber);

    const [leagueWeek, roster] = await Promise.all([
      prisma.leagueWeek.findUniqueOrThrow({
        where: {
          leagueId_weekNumber: {
            leagueId,
            weekNumber,
          },
        },
      }),
      prisma.roster.findUnique({
        where: {
          leagueMemberId: membership.id,
        },
        include: {
          rosterPlayers: {
            include: {
              player: {
                select: {
                  id: true,
                  name: true,
                  team: true,
                  region: true,
                  roles: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!roster) {
      return NextResponse.json({ error: 'Roster not found' }, { status: 404 });
    }

    if (leagueWeek.isLineupLocked) {
      return NextResponse.json({ error: 'This week is locked' }, { status: 400 });
    }

    const rosterPlayer = roster.rosterPlayers.find(
      (entry) => entry.playerId === body.playerId || entry.id === body.playerId
    );

    if (!rosterPlayer) {
      return NextResponse.json({ error: 'Player is not on your roster' }, { status: 400 });
    }

    if (rosterPlayer.isCaptain) {
      return NextResponse.json({ error: 'Captains cannot be designated as Star Players' }, { status: 400 });
    }

    if (rosterPlayer.starBannedUntilWeek && rosterPlayer.starBannedUntilWeek > weekNumber) {
      return NextResponse.json(
        { error: `This player is banned from your roster until week ${rosterPlayer.starBannedUntilWeek}` },
        { status: 400 }
      );
    }

    const priorStar = await prisma.weeklyLineup.findFirst({
      where: {
        rosterId: roster.id,
        weekNumber: {
          gte: Math.max(1, weekNumber - STAR_PLAYER_COOLDOWN_WEEKS),
          lt: weekNumber,
        },
        slots: {
          some: {
            rosterPlayerId: rosterPlayer.id,
            isStarPlayer: true,
          },
        },
      },
      orderBy: {
        weekNumber: 'desc',
      },
      select: {
        weekNumber: true,
      },
    });

    if (priorStar) {
      return NextResponse.json(
        {
          error: `This player is on cooldown until week ${priorStar.weekNumber + STAR_PLAYER_COOLDOWN_WEEKS + 1}`,
        },
        { status: 400 }
      );
    }

    const lineup = await prisma.weeklyLineup.findUnique({
      where: {
        rosterId_weekNumber: {
          rosterId: roster.id,
          weekNumber,
        },
      },
      include: {
        slots: true,
      },
    });

    if (!lineup) {
      return NextResponse.json(
        { error: 'No lineup set for this week. Save your active lineup first.' },
        { status: 400 }
      );
    }

    if (lineup.isLocked) {
      return NextResponse.json({ error: 'This lineup is locked' }, { status: 400 });
    }

    const targetSlot = lineup.slots.find((slot) => slot.rosterPlayerId === rosterPlayer.id);
    if (!targetSlot) {
      return NextResponse.json(
        { error: 'Player must be in your active lineup to be designated as Star Player' },
        { status: 400 }
      );
    }

    const banUntilWeek = weekNumber + STAR_PLAYER_COOLDOWN_WEEKS + 1;

    await prisma.$transaction(async (tx) => {
      await tx.lineupSlot.updateMany({
        where: {
          weeklyLineupId: lineup.id,
          isStarPlayer: true,
        },
        data: {
          isStarPlayer: false,
        },
      });

      await tx.lineupSlot.update({
        where: {
          id: targetSlot.id,
        },
        data: {
          isStarPlayer: true,
        },
      });

      // Ban the starred player from the roster for 2 weeks
      await tx.rosterPlayer.update({
        where: {
          id: rosterPlayer.id,
        },
        data: {
          starBannedUntilWeek: banUntilWeek,
        },
      });
    });

    await saveLeagueWeekScores(leagueId, weekNumber);
    const rosterResponse = await buildRosterResponse(leagueId, userId, weekNumber);

    if (!rosterResponse.activeLineup) {
      throw new Error('Failed to reload updated lineup');
    }

    return NextResponse.json({
      lineup: rosterResponse.activeLineup,
      roster: rosterResponse,
    });
  } catch (error) {
    console.error('PUT /api/leagues/[leagueId]/roster/star failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
