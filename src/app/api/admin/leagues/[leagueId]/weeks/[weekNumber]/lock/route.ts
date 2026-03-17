import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { ensureLeagueWeek } from '@/src/server/roster-service';

type LockWeekRequest = {
  isLocked: boolean;
};

export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ leagueId: string; weekNumber: string }>;
  }
): Promise<NextResponse<{ leagueId: string; weekNumber: number; isLocked: boolean } | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId, weekNumber: weekNumberParam } = await params;
    const weekNumber = Number(weekNumberParam);
    const body = (await request.json()) as Partial<LockWeekRequest>;

    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      return NextResponse.json({ error: 'weekNumber must be a positive integer' }, { status: 400 });
    }

    if (typeof body.isLocked !== 'boolean') {
      return NextResponse.json({ error: 'isLocked must be a boolean' }, { status: 400 });
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: {
        id: true,
        creatorId: true,
      },
    });

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    if (league.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the league creator can lock league weeks' }, { status: 403 });
    }

    await ensureLeagueWeek(leagueId, weekNumber);

    await prisma.$transaction(async (tx) => {
      await tx.leagueWeek.update({
        where: {
          leagueId_weekNumber: {
            leagueId,
            weekNumber,
          },
        },
        data: {
          isLineupLocked: body.isLocked,
        },
      });

      await tx.weeklyLineup.updateMany({
        where: {
          weekNumber,
          roster: {
            leagueId,
          },
        },
        data: {
          isLocked: body.isLocked,
        },
      });
    });

    return NextResponse.json({
      leagueId,
      weekNumber,
      isLocked: body.isLocked,
    });
  } catch (error) {
    console.error('PUT /api/admin/leagues/[leagueId]/weeks/[weekNumber]/lock failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
