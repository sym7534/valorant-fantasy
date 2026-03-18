import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { ACTIVE_LINEUP_SIZE } from '@/src/lib/game-config';
import type { RosterLineupRequest, RosterLineupResponse } from '@/src/lib/api-types';
import { buildRosterResponse, checkAndAutoLockWeek, ensureLeagueWeek } from '@/src/server/roster-service';
import { saveLeagueWeekScores } from '@/src/server/scoring-engine';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterLineupResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const body = (await request.json()) as Partial<RosterLineupRequest>;

    if (
      !body.playerIds ||
      !Array.isArray(body.playerIds) ||
      body.playerIds.length !== ACTIVE_LINEUP_SIZE
    ) {
      return NextResponse.json(
        { error: `Lineup must contain exactly ${ACTIVE_LINEUP_SIZE} players` },
        { status: 400 }
      );
    }

    const playerIds = body.playerIds.filter(
      (playerId, index, values): playerId is string =>
        typeof playerId === 'string' && values.indexOf(playerId) === index
    );

    if (playerIds.length !== ACTIVE_LINEUP_SIZE) {
      return NextResponse.json({ error: 'Lineup cannot include duplicate players' }, { status: 400 });
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
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Lineups can only be set once the draft is complete' }, { status: 400 });
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

    const rosterPlayerByPlayerId = new Map(
      roster.rosterPlayers.map((rosterPlayer) => [rosterPlayer.playerId, rosterPlayer])
    );

    for (const playerId of playerIds) {
      const rosterPlayer = rosterPlayerByPlayerId.get(playerId);
      if (!rosterPlayer) {
        return NextResponse.json(
          { error: `Player ${playerId} is not on your roster` },
          { status: 400 }
        );
      }
      if (rosterPlayer.starBannedUntilWeek && rosterPlayer.starBannedUntilWeek > weekNumber) {
        return NextResponse.json(
          { error: `${rosterPlayer.player.name} is banned from your roster until week ${rosterPlayer.starBannedUntilWeek}` },
          { status: 400 }
        );
      }
    }

    const captain = roster.rosterPlayers.find((rosterPlayer) => rosterPlayer.isCaptain);
    if (captain && !playerIds.includes(captain.playerId)) {
      return NextResponse.json(
        { error: 'Your captain must remain in the active lineup' },
        { status: 400 }
      );
    }

    const lineup = await prisma.$transaction(async (tx) => {
      const existingLineup = await tx.weeklyLineup.findUnique({
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
      const existingStarRosterPlayerId =
        existingLineup?.slots.find((slot) => slot.isStarPlayer)?.rosterPlayerId ?? null;

      const weeklyLineup = existingLineup
        ? await tx.weeklyLineup.update({
            where: { id: existingLineup.id },
            data: {
              isLocked: false,
            },
          })
        : await tx.weeklyLineup.create({
            data: {
              rosterId: roster.id,
              weekNumber,
              isLocked: false,
            },
          });

      await tx.lineupSlot.deleteMany({
        where: {
          weeklyLineupId: weeklyLineup.id,
        },
      });

      for (const playerId of playerIds) {
        const rosterPlayer = rosterPlayerByPlayerId.get(playerId);
        if (!rosterPlayer) {
          continue;
        }

        await tx.lineupSlot.create({
          data: {
            weeklyLineupId: weeklyLineup.id,
            rosterPlayerId: rosterPlayer.id,
            isStarPlayer:
              existingStarRosterPlayerId === rosterPlayer.id && !rosterPlayer.isCaptain,
          },
        });
      }

      return tx.weeklyLineup.findUniqueOrThrow({
        where: { id: weeklyLineup.id },
        include: {
          slots: {
            include: {
              rosterPlayer: {
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
          },
        },
      });
    });

    await saveLeagueWeekScores(leagueId, weekNumber);
    const rosterResponse = await buildRosterResponse(leagueId, userId, weekNumber);

    return NextResponse.json({
      lineup: rosterResponse.activeLineup ?? {
        id: lineup.id,
        weekNumber: lineup.weekNumber,
        isLocked: lineup.isLocked,
        slots: [],
      },
      roster: rosterResponse,
    });
  } catch (error) {
    console.error('PUT /api/leagues/[leagueId]/roster/lineup failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
