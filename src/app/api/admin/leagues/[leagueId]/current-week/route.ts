import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { ensureLeagueWeek } from '@/src/server/roster-service';

type CurrentWeekRequest = {
  weekNumber: number;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<{ leagueId: string; currentWeek: number } | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const body = (await request.json()) as Partial<CurrentWeekRequest>;
    const weekNumber = body.weekNumber;

    if (typeof weekNumber !== 'number' || !Number.isInteger(weekNumber) || weekNumber < 1) {
      return NextResponse.json({ error: 'weekNumber must be a positive integer' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only the league creator can update the current week' }, { status: 403 });
    }

    await ensureLeagueWeek(leagueId, weekNumber);

    const updatedLeague = await prisma.league.update({
      where: { id: leagueId },
      data: {
        currentWeek: weekNumber,
      },
      select: {
        id: true,
        currentWeek: true,
      },
    });

    return NextResponse.json({
      leagueId: updatedLeague.id,
      currentWeek: updatedLeague.currentWeek,
    });
  } catch (error) {
    console.error('PUT /api/admin/leagues/[leagueId]/current-week failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
