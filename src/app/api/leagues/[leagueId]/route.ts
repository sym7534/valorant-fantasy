import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import type { LeagueDetailResponse } from '@/src/lib/api-types';
import { loadLeagueDetailForUser } from '@/src/server/league-service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<LeagueDetailResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const league = await loadLeagueDetailForUser(leagueId, userId);

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    return NextResponse.json({ league });
  } catch (error) {
    console.error('GET /api/leagues/[leagueId] failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
