import { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';
import {
  ACTIVE_LINEUP_SIZE,
  CAPTAIN_MULTIPLIER,
  STAR_PLAYER_MULTIPLIER,
  applyMultiplier,
  calculateBaseScore,
} from '@/src/lib/game-config';
import type { PlayerDesignation, PlayerMatchStats } from '@/src/lib/game-config';
import type { PlayerScoreBreakdown } from '@/src/lib/api-types';

type MatchStatRecord = {
  kills: number;
  deaths: number;
  assists: number;
  firstKills: number;
  firstDeaths: number;
  roundsWon: number;
  roundsLost: number;
  adr: number;
};

export type LeagueWeekScoreResult = {
  leagueMemberId: string;
  totalPoints: number;
  breakdown: PlayerScoreBreakdown[];
};

function aggregateMatchStats(matchStats: MatchStatRecord[]): PlayerMatchStats {
  const aggregate = matchStats.reduce<PlayerMatchStats>(
    (current, stats) => ({
      kills: current.kills + stats.kills,
      deaths: current.deaths + stats.deaths,
      assists: current.assists + stats.assists,
      firstKills: current.firstKills + stats.firstKills,
      firstDeaths: current.firstDeaths + stats.firstDeaths,
      roundsWon: current.roundsWon + stats.roundsWon,
      roundsLost: current.roundsLost + stats.roundsLost,
      adr: current.adr + stats.adr,
    }),
    {
      kills: 0,
      deaths: 0,
      assists: 0,
      firstKills: 0,
      firstDeaths: 0,
      roundsWon: 0,
      roundsLost: 0,
      adr: 0,
    }
  );

  if (matchStats.length > 0) {
    aggregate.adr = aggregate.adr / matchStats.length;
  }

  return aggregate;
}

function toBreakdownEntry(
  playerId: string,
  playerName: string,
  stats: PlayerMatchStats,
  designation: PlayerDesignation
): PlayerScoreBreakdown {
  const baseScore = Number(calculateBaseScore(stats).toFixed(1));
  const finalScore = Number(applyMultiplier(baseScore, designation).toFixed(1));

  return {
    playerId,
    playerName,
    baseScore,
    multiplier:
      designation === 'star'
        ? STAR_PLAYER_MULTIPLIER
        : designation === 'captain'
          ? CAPTAIN_MULTIPLIER
          : 1,
    finalScore,
    designation,
  };
}

export async function calculateLeagueWeekScores(
  leagueId: string,
  weekNumber: number
): Promise<LeagueWeekScoreResult[]> {
  const rosters = await prisma.roster.findMany({
    where: { leagueId },
    include: {
      leagueMember: true,
      weeklyLineups: {
        where: { weekNumber },
        include: {
          slots: {
            include: {
              rosterPlayer: {
                include: {
                  player: {
                    include: {
                      matchStats: {
                        where: { weekNumber },
                        select: {
                          kills: true,
                          deaths: true,
                          assists: true,
                          firstKills: true,
                          firstDeaths: true,
                          roundsWon: true,
                          roundsLost: true,
                          adr: true,
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
    },
  });

  return rosters.map((roster) => {
    const lineup = roster.weeklyLineups[0];
    if (!lineup || lineup.slots.length !== ACTIVE_LINEUP_SIZE) {
      return {
        leagueMemberId: roster.leagueMemberId,
        totalPoints: 0,
        breakdown: [],
      };
    }

    const breakdown = lineup.slots.map((slot) => {
      const matchStats = aggregateMatchStats(slot.rosterPlayer.player.matchStats);
      const designation: PlayerDesignation = slot.isStarPlayer
        ? 'star'
        : slot.rosterPlayer.isCaptain
          ? 'captain'
          : 'normal';

      return toBreakdownEntry(
        slot.rosterPlayer.playerId,
        slot.rosterPlayer.player.name,
        matchStats,
        designation
      );
    });

    const totalPoints = Number(
      breakdown.reduce((sum, entry) => sum + entry.finalScore, 0).toFixed(1)
    );

    return {
      leagueMemberId: roster.leagueMemberId,
      totalPoints,
      breakdown,
    };
  });
}

export async function saveLeagueWeekScores(
  leagueId: string,
  weekNumber: number
): Promise<LeagueWeekScoreResult[]> {
  const results = await calculateLeagueWeekScores(leagueId, weekNumber);

  await prisma.$transaction(
    results.map((result) =>
      prisma.weeklyScore.upsert({
        where: {
          leagueMemberId_weekNumber: {
            leagueMemberId: result.leagueMemberId,
            weekNumber,
          },
        },
        create: {
          leagueMemberId: result.leagueMemberId,
          weekNumber,
          totalPoints: result.totalPoints,
          breakdown: result.breakdown as unknown as Prisma.InputJsonValue,
        },
        update: {
          totalPoints: result.totalPoints,
          breakdown: result.breakdown as unknown as Prisma.InputJsonValue,
        },
      })
    )
  );

  return results;
}

export async function syncLeagueScores(leagueId: string): Promise<void> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      weeks: {
        orderBy: { weekNumber: 'asc' },
      },
    },
  });

  if (!league) {
    return;
  }

  for (const week of league.weeks) {
    if (week.weekNumber > league.currentWeek) {
      continue;
    }

    await saveLeagueWeekScores(leagueId, week.weekNumber);
  }
}
