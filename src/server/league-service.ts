import { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';
import type { LeagueDetail } from '@/src/lib/api-types';
import { buildLeagueDetail } from '@/src/server/serializers';

const leagueDetailInclude = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  },
  weeks: {
    orderBy: {
      weekNumber: 'asc',
    },
  },
  draft: {
    include: {
      picks: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
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
        orderBy: {
          pickNumber: 'asc',
        },
      },
    },
  },
} satisfies Prisma.LeagueInclude;

export async function loadLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: leagueDetailInclude,
  });

  return league ? buildLeagueDetail(league) : null;
}

export async function loadLeagueDetailForUser(
  leagueId: string,
  userId: string
): Promise<LeagueDetail | null> {
  const membership = await prisma.leagueMember.findUnique({
    where: {
      leagueId_userId: {
        leagueId,
        userId,
      },
    },
  });

  if (!membership) {
    return null;
  }

  return loadLeagueDetail(leagueId);
}
