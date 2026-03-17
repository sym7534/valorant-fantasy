import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import type { RosterResponse } from '@/src/lib/api-types';
import { buildRosterResponse } from '@/src/server/roster-service';
import { saveLeagueWeekScores } from '@/src/server/scoring-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<RosterResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const weekNumberParam = request.nextUrl.searchParams.get('week');
    const weekNumber = weekNumberParam ? Number(weekNumberParam) : undefined;

    if (weekNumberParam && (!Number.isInteger(weekNumber) || weekNumber! < 1)) {
      return NextResponse.json({ error: 'week must be a positive integer' }, { status: 400 });
    }

    const roster = await buildRosterResponse(leagueId, userId, weekNumber);
    if (roster.selectedWeek <= roster.currentWeek) {
      await saveLeagueWeekScores(leagueId, roster.selectedWeek);
      return NextResponse.json(await buildRosterResponse(leagueId, userId, weekNumber));
    }

    return NextResponse.json(roster);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      {
        status:
          message === 'League not found' ? 404 : message === 'Not a member of this league' ? 403 : 500,
      }
    );
  }
}
