import { randomInt } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import {
  DEFAULT_DRAFT_TIMER,
  DRAFT_TIMER_OPTIONS,
  INVITE_CODE_LENGTH,
  LEAGUE_NAME_MAX_LENGTH,
  MAX_ROSTER_SIZE,
  MIN_ROSTER_SIZE,
} from '@/src/lib/game-config';
import type {
  LeagueActivityEntry,
  LeagueCreateRequest,
  LeagueCreateResponse,
  LeagueListResponse,
  LeagueSummary,
} from '@/src/lib/api-types';
import { loadLeagueDetail } from '@/src/server/league-service';

function buildInviteCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  return Array.from({ length: INVITE_CODE_LENGTH }, () => {
    const index = randomInt(0, characters.length);
    return characters[index];
  }).join('');
}

async function generateUniqueInviteCode(): Promise<string> {
  let inviteCode = buildInviteCode();

  while (await prisma.league.findUnique({ where: { inviteCode } })) {
    inviteCode = buildInviteCode();
  }

  return inviteCode;
}

export async function GET(): Promise<NextResponse<LeagueListResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const memberships = await prisma.leagueMember.findMany({
      where: {
        userId,
      },
      include: {
        league: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
            draft: {
              select: {
                startedAt: true,
                completedAt: true,
              },
            },
          },
        },
        weeklyScores: {
          orderBy: {
            weekNumber: 'asc',
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const leagueIds = memberships.map((membership) => membership.leagueId);
    const allLeagueMembers = await prisma.leagueMember.findMany({
      where: {
        leagueId: {
          in: leagueIds,
        },
      },
      include: {
        weeklyScores: true,
      },
    });

    const totalPointsByLeagueAndUser = new Map<string, number>();
    for (const member of allLeagueMembers) {
      const totalPoints = member.weeklyScores.reduce(
        (sum, weeklyScore) => sum + weeklyScore.totalPoints,
        0
      );
      totalPointsByLeagueAndUser.set(`${member.leagueId}:${member.userId}`, totalPoints);
    }

    const leagues: LeagueSummary[] = memberships.map((membership) => {
      const leagueMembers = allLeagueMembers.filter(
        (member) => member.leagueId === membership.leagueId
      );
      const rank =
        leagueMembers
          .slice()
          .sort((left, right) => {
            const leftPoints =
              totalPointsByLeagueAndUser.get(`${left.leagueId}:${left.userId}`) ?? 0;
            const rightPoints =
              totalPointsByLeagueAndUser.get(`${right.leagueId}:${right.userId}`) ?? 0;

            return rightPoints - leftPoints;
          })
          .findIndex((member) => member.userId === userId) + 1;

      const latestWeeklyScore =
        membership.weeklyScores.find(
          (weeklyScore) => weeklyScore.weekNumber === membership.league.currentWeek
        ) ?? null;
      const totalPoints =
        totalPointsByLeagueAndUser.get(`${membership.leagueId}:${userId}`) ?? 0;

      return {
        id: membership.league.id,
        name: membership.league.name,
        status: membership.league.status,
        memberCount: membership.league._count.members,
        rosterSize: membership.league.rosterSize,
        draftPickTime: membership.league.draftPickTime,
        creatorId: membership.league.creatorId,
        currentWeek: membership.league.currentWeek,
        createdAt: membership.league.createdAt.toISOString(),
        archivedAt: membership.league.archivedAt?.toISOString() ?? null,
        myRank: membership.league.status === 'ACTIVE' ? rank : null,
        currentWeekPoints: latestWeeklyScore?.totalPoints ?? null,
        totalPoints: membership.league.status === 'ACTIVE' ? totalPoints : null,
      };
    });

    const activity: LeagueActivityEntry[] = memberships
      .flatMap((membership) => {
        const entries: LeagueActivityEntry[] = [
          {
            id: `${membership.id}:joined`,
            leagueId: membership.leagueId,
            type: membership.league.creatorId === userId ? 'league_created' : 'league_joined',
            message:
              membership.league.creatorId === userId
                ? `You created ${membership.league.name}`
                : `You joined ${membership.league.name}`,
            timestamp: membership.joinedAt.toISOString(),
          },
        ];

        if (membership.league.draft?.startedAt) {
          entries.push({
            id: `${membership.leagueId}:draft-started`,
            leagueId: membership.leagueId,
            type: 'draft_started',
            message: `${membership.league.name} draft started`,
            timestamp: membership.league.draft.startedAt.toISOString(),
          });
        }

        if (membership.league.draft?.completedAt) {
          entries.push({
            id: `${membership.leagueId}:draft-completed`,
            leagueId: membership.leagueId,
            type: 'draft_completed',
            message: `${membership.league.name} draft completed`,
            timestamp: membership.league.draft.completedAt.toISOString(),
          });
        }

        const currentWeekScore = membership.weeklyScores.find(
          (weeklyScore) => weeklyScore.weekNumber === membership.league.currentWeek
        );

        if (currentWeekScore) {
          entries.push({
            id: `${membership.id}:week-${currentWeekScore.weekNumber}`,
            leagueId: membership.leagueId,
            type: 'week_scored',
            message: `Week ${currentWeekScore.weekNumber} scoring updated for ${membership.league.name}`,
            timestamp: membership.league.updatedAt.toISOString(),
          });
        }

        return entries;
      })
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .slice(0, 10);

    return NextResponse.json({
      leagues,
      activity,
    });
  } catch (error) {
    console.error('GET /api/leagues failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LeagueCreateResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<LeagueCreateRequest>;
    const trimmedName = body.name?.trim();

    if (!trimmedName) {
      return NextResponse.json({ error: 'League name is required' }, { status: 400 });
    }

    if (trimmedName.length > LEAGUE_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `League name must be ${LEAGUE_NAME_MAX_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (
      typeof body.rosterSize !== 'number' ||
      !Number.isInteger(body.rosterSize) ||
      body.rosterSize < MIN_ROSTER_SIZE ||
      body.rosterSize > MAX_ROSTER_SIZE
    ) {
      return NextResponse.json(
        {
          error: `Roster size must be between ${MIN_ROSTER_SIZE} and ${MAX_ROSTER_SIZE}`,
        },
        { status: 400 }
      );
    }

    const draftPickTime = body.draftPickTime ?? DEFAULT_DRAFT_TIMER;
    if (!DRAFT_TIMER_OPTIONS.includes(draftPickTime)) {
      return NextResponse.json(
        {
          error: `Draft timer must be one of ${DRAFT_TIMER_OPTIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const inviteCode = await generateUniqueInviteCode();

    const createdLeague = await prisma.$transaction(async (tx) => {
      const league = await tx.league.create({
        data: {
          name: trimmedName,
          inviteCode,
          creatorId: userId,
          rosterSize: body.rosterSize,
          draftPickTime,
        },
      });

      await tx.leagueMember.create({
        data: {
          leagueId: league.id,
          userId,
        },
      });

      await tx.leagueWeek.create({
        data: {
          leagueId: league.id,
          weekNumber: 1,
        },
      });

      await tx.draftState.create({
        data: {
          leagueId: league.id,
          status: 'WAITING',
          currentRound: 1,
          currentPickIndex: 0,
          draftOrder: [],
        },
      });

      return league;
    });

    const league = await loadLeagueDetail(createdLeague.id);
    if (!league) {
      throw new Error('Failed to load created league');
    }

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leagues failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
