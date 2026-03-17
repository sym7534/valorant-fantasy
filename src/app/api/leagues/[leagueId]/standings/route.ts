import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import type {
  PlayerScoreBreakdown,
  StandingEntry,
  StandingsResponse,
  WeeklyScoreEntry,
} from '@/src/lib/api-types';
import { buildLineupSlotEntry, toUserSummary } from '@/src/server/serializers';
import { syncLeagueScores } from '@/src/server/scoring-engine';

const playerSummarySelect = {
  id: true,
  name: true,
  team: true,
  region: true,
  role: true,
  imageUrl: true,
} satisfies Prisma.PlayerSelect;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<StandingsResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;

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

    await syncLeagueScores(leagueId);

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        currentWeek: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    const members = await prisma.leagueMember.findMany({
      where: { leagueId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        weeklyScores: {
          orderBy: {
            weekNumber: 'asc',
          },
        },
        roster: {
          include: {
            weeklyLineups: {
              where: {
                weekNumber: league.currentWeek,
              },
              include: {
                slots: {
                  include: {
                    rosterPlayer: {
                      include: {
                        player: {
                          select: playerSummarySelect,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const standings: StandingEntry[] = members.map((member) => {
      const weeklyScores: WeeklyScoreEntry[] = member.weeklyScores.map((weeklyScore) => ({
        weekNumber: weeklyScore.weekNumber,
        totalPoints: weeklyScore.totalPoints,
        breakdown: (weeklyScore.breakdown as PlayerScoreBreakdown[] | null) ?? [],
      }));
      const currentWeekPoints =
        weeklyScores.find((weeklyScore) => weeklyScore.weekNumber === league.currentWeek)?.totalPoints ?? 0;
      const previousWeekPoints =
        weeklyScores.find((weeklyScore) => weeklyScore.weekNumber === league.currentWeek - 1)?.totalPoints ?? currentWeekPoints;
      const totalPoints = Number(
        weeklyScores.reduce((sum, weeklyScore) => sum + weeklyScore.totalPoints, 0).toFixed(1)
      );
      const latestLineup = member.roster?.weeklyLineups[0] ?? null;
      const lineupScoreMap = new Map(
        (
          ((member.weeklyScores.find((weeklyScore) => weeklyScore.weekNumber === league.currentWeek)
            ?.breakdown as PlayerScoreBreakdown[] | null) ?? [])
        ).map((entry) => [entry.playerId, entry.finalScore])
      );

      return {
        rank: 0,
        userId: member.userId,
        user: toUserSummary(member.user),
        totalPoints,
        currentWeekPoints,
        trend:
          currentWeekPoints > previousWeekPoints
            ? 'up'
            : currentWeekPoints < previousWeekPoints
              ? 'down'
              : 'same',
        weeklyScores,
        currentLineup: latestLineup
          ? latestLineup.slots.map((slot) =>
              buildLineupSlotEntry(slot, lineupScoreMap)
            )
          : [],
      };
    });

    standings.sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      return right.currentWeekPoints - left.currentWeekPoints;
    });

    standings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      leagueId,
      currentWeek: league.currentWeek,
      standings,
    });
  } catch (error) {
    console.error('GET /api/leagues/[leagueId]/standings failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
