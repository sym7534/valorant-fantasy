import { prisma } from '@/src/lib/prisma';
import { autoResolveDraftTurn, getDraftStateResponse } from '@/src/server/draft-engine';
import type { DraftStateResponse } from '@/src/lib/api-types';

/**
 * Lazily resolves expired draft turns.
 * Called on every draft-related API request to handle timer expiry
 * without needing a persistent server process.
 */
export async function resolveExpiredDraftTurns(leagueId: string): Promise<DraftStateResponse | null> {
  const draftState = await prisma.draftState.findUnique({
    where: { leagueId },
    select: {
      status: true,
      turnExpiresAt: true,
    },
  });

  if (!draftState || draftState.status !== 'IN_PROGRESS' || !draftState.turnExpiresAt) {
    return null;
  }

  // Keep resolving expired turns until we're caught up or draft is complete
  let resolved = false;
  const MAX_ITERATIONS = 100; // Safety limit
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const current = await prisma.draftState.findUnique({
      where: { leagueId },
      select: {
        status: true,
        turnExpiresAt: true,
      },
    });

    if (!current || current.status !== 'IN_PROGRESS' || !current.turnExpiresAt) {
      break;
    }

    if (current.turnExpiresAt > new Date()) {
      break; // Timer hasn't expired yet
    }

    // Timer expired — auto-resolve this turn
    try {
      await autoResolveDraftTurn(leagueId);
      resolved = true;
    } catch {
      break; // Stop if resolution fails
    }
  }

  if (resolved) {
    return getDraftStateResponse(leagueId);
  }

  return null;
}
