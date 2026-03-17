import { prisma } from '@/src/lib/prisma';
import { STAR_PLAYER_COOLDOWN_WEEKS } from '@/src/lib/game-config';
import type {
  PlayerScoreBreakdown,
  RosterResponse,
} from '@/src/lib/api-types';
import {
  buildLeagueWeekSummaries,
  buildLineupSlotEntry,
  buildWeeklyScoreEntry,
  toPlayerSummary,
} from '@/src/server/serializers';

export async function ensureLeagueWeek(
  leagueId: string,
  weekNumber: number
): Promise<void> {
  await prisma.leagueWeek.upsert({
    where: {
      leagueId_weekNumber: {
        leagueId,
        weekNumber,
      },
    },
    create: {
      leagueId,
      weekNumber,
    },
    update: {},
  });
}

function getCooldownWeeksLeft(
  selectedWeek: number,
  lastStarredWeek: number | undefined
): number {
  if (!lastStarredWeek) {
    return 0;
  }

  const elapsedWeeks = selectedWeek - lastStarredWeek;
  return Math.max(0, STAR_PLAYER_COOLDOWN_WEEKS - elapsedWeeks + 1);
}

export async function buildRosterResponse(
  leagueId: string,
  userId: string,
  weekNumber?: number
): Promise<RosterResponse> {
  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new Error('Not a member of this league');
  }

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
      },
    },
  });

  if (!league) {
    throw new Error('League not found');
  }

  const selectedWeek = weekNumber ?? league.currentWeek;
  await ensureLeagueWeek(leagueId, selectedWeek);

  const [refreshedLeague, roster, weeklyScores] = await Promise.all([
    prisma.league.findUniqueOrThrow({
      where: { id: leagueId },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
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
                role: true,
                imageUrl: true,
              },
            },
          },
          orderBy: [
            { isCaptain: 'desc' },
            { player: { name: 'asc' } },
          ],
        },
        weeklyLineups: {
          where: {
            weekNumber: selectedWeek,
          },
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
                        role: true,
                        imageUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.weeklyScore.findMany({
      where: {
        leagueMemberId: membership.id,
      },
      orderBy: {
        weekNumber: 'asc',
      },
    }),
  ]);

  if (!roster) {
    return {
      id: '',
      leagueId,
      leagueName: refreshedLeague.name,
      currentWeek: refreshedLeague.currentWeek,
      selectedWeek,
      weekSummaries: buildLeagueWeekSummaries(refreshedLeague.weeks, refreshedLeague.currentWeek),
      players: [],
      activeLineup: null,
      weeklyScore: null,
    };
  }

  const starHistory = await prisma.weeklyLineup.findMany({
    where: {
      rosterId: roster.id,
      weekNumber: {
        gte: Math.max(1, selectedWeek - STAR_PLAYER_COOLDOWN_WEEKS),
        lt: selectedWeek,
      },
    },
    include: {
      slots: {
        where: {
          isStarPlayer: true,
        },
        select: {
          rosterPlayerId: true,
        },
      },
    },
    orderBy: {
      weekNumber: 'desc',
    },
  });

  const lastStarredWeekByRosterPlayer = new Map<string, number>();
  for (const lineup of starHistory) {
    for (const slot of lineup.slots) {
      if (!lastStarredWeekByRosterPlayer.has(slot.rosterPlayerId)) {
        lastStarredWeekByRosterPlayer.set(slot.rosterPlayerId, lineup.weekNumber);
      }
    }
  }

  const weeklyScoreRecord =
    weeklyScores.find((weeklyScore) => weeklyScore.weekNumber === selectedWeek) ?? null;
  const breakdown = (weeklyScoreRecord?.breakdown as PlayerScoreBreakdown[] | null) ?? [];
  const pointsByPlayerId = new Map<string, number>(
    breakdown.map((entry) => [entry.playerId, entry.finalScore])
  );
  const totalPointsByWeek = new Map<number, number | null>(
    weeklyScores.map((weeklyScore) => [weeklyScore.weekNumber, weeklyScore.totalPoints])
  );
  const lineup = roster.weeklyLineups[0] ?? null;
  const lineupByRosterPlayerId = new Map(
    lineup?.slots.map((slot) => [slot.rosterPlayerId, slot]) ?? []
  );

  return {
    id: roster.id,
    leagueId,
    leagueName: refreshedLeague.name,
    currentWeek: refreshedLeague.currentWeek,
    selectedWeek,
    weekSummaries: buildLeagueWeekSummaries(
      refreshedLeague.weeks,
      refreshedLeague.currentWeek,
      totalPointsByWeek
    ),
    players: roster.rosterPlayers.map((rosterPlayer) => {
      const lineupSlot = lineupByRosterPlayerId.get(rosterPlayer.id);

      return {
        id: rosterPlayer.id,
        playerId: rosterPlayer.playerId,
        player: toPlayerSummary(rosterPlayer.player),
        isCaptain: rosterPlayer.isCaptain,
        slotType: rosterPlayer.slotType,
        isInActiveLineup: Boolean(lineupSlot),
        isStarPlayer: Boolean(lineupSlot?.isStarPlayer),
        starCooldownWeeksLeft: getCooldownWeeksLeft(
          selectedWeek,
          lastStarredWeekByRosterPlayer.get(rosterPlayer.id)
        ),
        weeklyPoints: pointsByPlayerId.get(rosterPlayer.playerId) ?? null,
      };
    }),
    activeLineup: lineup
      ? {
          id: lineup.id,
          weekNumber: lineup.weekNumber,
          isLocked: lineup.isLocked,
          slots: lineup.slots.map((slot) => buildLineupSlotEntry(slot, pointsByPlayerId)),
        }
      : null,
    weeklyScore: weeklyScoreRecord
      ? buildWeeklyScoreEntry(
          weeklyScoreRecord.weekNumber,
          weeklyScoreRecord.totalPoints,
          breakdown
        )
      : null,
  };
}
