import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import type { DraftGetResponse, DraftQueueEntry } from '@/src/lib/api-types';
import { loadLeagueDetailForUser } from '@/src/server/league-service';
import { toPlayerSummary } from '@/src/server/serializers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftGetResponse | { error: string }>> {
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

    if (!league.draft) {
      return NextResponse.json({ error: 'Draft state is unavailable' }, { status: 404 });
    }

    const [queueEntries, players] = await Promise.all([
      prisma.draftQueueEntry.findMany({
        where: {
          leagueId,
          userId,
        },
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
        orderBy: {
          priority: 'asc',
        },
      }),
      prisma.player.findMany({
        select: {
          id: true,
          name: true,
          team: true,
          region: true,
          role: true,
          imageUrl: true,
        },
        orderBy: [{ team: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const queue: DraftQueueEntry[] = queueEntries.map((entry) => ({
      id: entry.id,
      priority: entry.priority,
      playerId: entry.playerId,
      player: toPlayerSummary(entry.player),
    }));

    return NextResponse.json({
      league: {
        id: league.id,
        name: league.name,
        status: league.status,
        rosterSize: league.rosterSize,
        draftPickTime: league.draftPickTime,
      },
      draft: league.draft,
      members: league.members,
      players: players.map(toPlayerSummary),
      queue,
      currentUserId: userId,
    });
  } catch (error) {
    console.error('GET /api/leagues/[leagueId]/draft failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
