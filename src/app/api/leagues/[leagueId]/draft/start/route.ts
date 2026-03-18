import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import type { DraftStartResponse } from '@/src/lib/api-types';
import { startDraft } from '@/src/server/draft-engine';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
): Promise<NextResponse<DraftStartResponse | { error: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { leagueId } = await params;
    const draft = await startDraft(leagueId, userId);

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
