import type { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/src/lib/prisma';
import type {
  DraftMutationResult,
} from '@/src/server/draft-engine';
import {
  autoResolveDraftTurn,
  getCurrentPickerUserId,
  getDraftStateResponse,
  getTurnNumber,
} from '@/src/server/draft-engine';
import type {
  SocketDraftCompletePayload,
  SocketDraftErrorPayload,
  SocketDraftJoinPayload,
  SocketDraftPickedPayload,
  SocketDraftTimerPayload,
  SocketDraftTurnPayload,
} from '@/src/lib/api-types';

const activeDraftTimers = new Map<string, NodeJS.Timeout>();
let ioInstance: SocketIOServer | null = null;

function draftRoom(leagueId: string): string {
  return `draft:${leagueId}`;
}

function emitDraftTurn(io: SocketIOServer, leagueId: string, draft: NonNullable<Awaited<ReturnType<typeof getDraftStateResponse>>>) {
  if (draft.status !== 'IN_PROGRESS') {
    return;
  }

  const turnPayload: SocketDraftTurnPayload = {
    userId: getCurrentPickerUserId(draft.draftOrder, draft.currentRound, draft.currentPickIndex),
    round: draft.currentRound,
    pickNumber: getTurnNumber(draft.currentRound, draft.currentPickIndex, draft.draftOrder.length),
    timeRemaining: draft.timeRemaining ?? 0,
  };

  io.to(draftRoom(leagueId)).emit('draft:turn', turnPayload);
}

export function clearDraftTimer(leagueId: string): void {
  const timer = activeDraftTimers.get(leagueId);
  if (timer) {
    clearInterval(timer);
    activeDraftTimers.delete(leagueId);
  }
}

async function tickDraftTimer(leagueId: string, io: SocketIOServer): Promise<void> {
  const draft = await getDraftStateResponse(leagueId);
  if (!draft || draft.status !== 'IN_PROGRESS') {
    clearDraftTimer(leagueId);
    return;
  }

  const timerPayload: SocketDraftTimerPayload = {
    secondsRemaining: draft.timeRemaining ?? 0,
  };
  io.to(draftRoom(leagueId)).emit('draft:timer', timerPayload);

  if ((draft.timeRemaining ?? 0) > 0) {
    return;
  }

  clearDraftTimer(leagueId);

  try {
    const result = await autoResolveDraftTurn(leagueId);
    await broadcastDraftMutation(leagueId, result);
  } catch (error) {
    console.error(`Failed to auto-resolve draft timer for league ${leagueId}`, error);
  }
}

export function ensureDraftTimer(leagueId: string, io: SocketIOServer = ioInstance as SocketIOServer): void {
  if (!io || activeDraftTimers.has(leagueId)) {
    return;
  }

  const interval = setInterval(() => {
    void tickDraftTimer(leagueId, io);
  }, 1000);

  activeDraftTimers.set(leagueId, interval);
  void tickDraftTimer(leagueId, io);
}

export async function resumeDraftTimers(io: SocketIOServer): Promise<void> {
  ioInstance = io;

  const activeDrafts = await prisma.draftState.findMany({
    where: {
      status: 'IN_PROGRESS',
    },
    select: {
      leagueId: true,
    },
  });

  for (const draft of activeDrafts) {
    ensureDraftTimer(draft.leagueId, io);
  }
}

export async function broadcastDraftMutation(
  leagueId: string,
  result: DraftMutationResult
): Promise<void> {
  if (!ioInstance) {
    return;
  }

  if (result.pick) {
    const pickedPayload: SocketDraftPickedPayload = {
      pick: result.pick,
    };
    ioInstance.to(draftRoom(leagueId)).emit('draft:picked', pickedPayload);
  }

  ioInstance.to(draftRoom(leagueId)).emit('draft:state', result.draft);

  if (result.didComplete) {
    clearDraftTimer(leagueId);
    const completePayload: SocketDraftCompletePayload = { leagueId };
    ioInstance.to(draftRoom(leagueId)).emit('draft:complete', completePayload);
    return;
  }

  emitDraftTurn(ioInstance, leagueId, result.draft);
  ensureDraftTimer(leagueId, ioInstance);
}

export function setupSocketHandlers(io: SocketIOServer): void {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    socket.on('draft:join', async (payload: SocketDraftJoinPayload) => {
      if (!payload?.leagueId) {
        const errorPayload: SocketDraftErrorPayload = {
          message: 'leagueId is required',
        };
        socket.emit('draft:error', errorPayload);
        return;
      }

      socket.join(draftRoom(payload.leagueId));

      const draft = await getDraftStateResponse(payload.leagueId);
      if (!draft) {
        const errorPayload: SocketDraftErrorPayload = {
          message: 'Draft not found for this league',
        };
        socket.emit('draft:error', errorPayload);
        return;
      }

      socket.emit('draft:state', draft);

      if (draft.status === 'IN_PROGRESS') {
        emitDraftTurn(io, payload.leagueId, draft);
        ensureDraftTimer(payload.leagueId, io);
      }

      if (draft.status === 'COMPLETE') {
        const completePayload: SocketDraftCompletePayload = {
          leagueId: payload.leagueId,
        };
        socket.emit('draft:complete', completePayload);
      }
    });
  });
}
