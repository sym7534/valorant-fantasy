import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import type {
  DraftQueueResponse,
  DraftQueueUpdateRequest,
} from '@/src/lib/api-types';
import { toPlayerSummary } from '@/src/server/serializers';

async function ensureMembership(leagueId: string, userId: string): Promise<void> {
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
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftQueueResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    await ensureMembership(leagueId, userId);

    const queue = await prisma.draftQueueEntry.findMany({
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
    });

    return NextResponse.json({
      queue: queue.map((entry) => ({
        id: entry.id,
        priority: entry.priority,
        playerId: entry.playerId,
        player: toPlayerSummary(entry.player),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Not a member of this league' ? 403 : 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftQueueResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    await ensureMembership(leagueId, userId);

    const body = (await request.json()) as Partial<DraftQueueUpdateRequest>;
    if (!body.playerIds || !Array.isArray(body.playerIds)) {
      return NextResponse.json({ error: 'playerIds must be an array' }, { status: 400 });
    }

    const playerIds = body.playerIds.filter(
      (playerId, index, values): playerId is string =>
        typeof playerId === 'string' && values.indexOf(playerId) === index
    );

    const knownPlayers = await prisma.player.findMany({
      where: {
        id: {
          in: playerIds,
        },
      },
      select: {
        id: true,
        name: true,
        team: true,
        region: true,
        role: true,
        imageUrl: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const playerLookup = new Map(knownPlayers.map((player) => [player.id, player]));

    await prisma.$transaction(async (tx) => {
      await tx.draftQueueEntry.deleteMany({
        where: {
          leagueId,
          userId,
        },
      });

      if (playerIds.length === 0) {
        return;
      }

      await tx.draftQueueEntry.createMany({
        data: playerIds
          .filter((playerId) => playerLookup.has(playerId))
          .map((playerId, index) => ({
            leagueId,
            userId,
            playerId,
            priority: index,
          })),
      });
    });

    return NextResponse.json({
      queue: playerIds
        .filter((playerId) => playerLookup.has(playerId))
        .map((playerId, index) => ({
          id: `${leagueId}:${userId}:${playerId}`,
          priority: index,
          playerId,
          player: toPlayerSummary(playerLookup.get(playerId)!),
        })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message === 'Not a member of this league' ? 403 : 500 }
    );
  }
}
