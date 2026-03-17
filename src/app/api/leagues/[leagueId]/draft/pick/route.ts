import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import type { DraftPickRequest, DraftPickResponse } from '@/src/lib/api-types';
import { makeDraftPick } from '@/src/server/draft-engine';
import { broadcastDraftMutation } from '@/src/server/socket';

function getStatusForDraftError(message: string): number {
  if (message === 'League not found' || message === 'Player not found') {
    return 404;
  }

  if (message === 'Not a member of this league') {
    return 403;
  }

  if (message === 'Unauthorized') {
    return 401;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftPickResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<DraftPickRequest>;
    if (!body.playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const { leagueId } = await params;
    const result = await makeDraftPick(leagueId, userId, body.playerId);
    await broadcastDraftMutation(leagueId, result);

    if (!result.pick) {
      throw new Error('Draft pick result was empty');
    }

    return NextResponse.json({
      pick: result.pick,
      draft: result.draft,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: getStatusForDraftError(message) });
  }
}
