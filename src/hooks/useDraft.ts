'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DraftGetResponse,
  DraftQueueEntry,
  DraftStateResponse,
  SocketDraftCompletePayload,
  SocketDraftTimerPayload,
} from '@/src/lib/api-types';
import { useSocket } from '@/src/hooks/useSocket';

type DraftApiError = {
  error?: string;
};

type UseDraftReturn = {
  data: DraftGetResponse | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  isMyTurn: boolean;
  currentPickerUserId: string | null;
  secondsRemaining: number;
  draftedPlayerIds: string[];
  refresh: () => Promise<void>;
  makePick: (playerId: string) => Promise<void>;
  updateQueue: (playerIds: string[]) => Promise<void>;
  setDraftState: (draft: DraftStateResponse) => void;
};

function filterQueueByDraftState(
  queue: DraftQueueEntry[],
  draft: DraftStateResponse
): DraftQueueEntry[] {
  const draftedPlayerIds = new Set(draft.picks.map((pick) => pick.playerId));
  return queue.filter((entry) => !draftedPlayerIds.has(entry.playerId));
}

function getCurrentPickerUserId(
  draftOrder: string[],
  round: number,
  pickIndex: number
): string {
  return round % 2 === 0
    ? draftOrder[draftOrder.length - 1 - pickIndex]
    : draftOrder[pickIndex];
}

export function useDraft(leagueId: string, userId: string): UseDraftReturn {
  const { emit, on, off, isConnected } = useSocket();
  const [data, setData] = useState<DraftGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const refresh = useCallback(async (): Promise<void> => {
    if (!leagueId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${leagueId}/draft`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as DraftGetResponse & DraftApiError;

      if (!response.ok || payload.error || !payload.draft) {
        throw new Error(payload.error ?? 'Failed to load draft');
      }

      setData({
        ...payload,
        queue: filterQueueByDraftState(payload.queue, payload.draft),
      });
      setSecondsRemaining(payload.draft.timeRemaining ?? 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isConnected || !leagueId) {
      return;
    }

    emit('draft:join', { leagueId });
  }, [emit, isConnected, leagueId]);

  useEffect(() => {
    const handleDraftState = (...args: unknown[]): void => {
      const [payload] = args;
      const draft = payload as DraftStateResponse;
      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          draft,
          queue: filterQueueByDraftState(current.queue, draft),
        };
      });
      setSecondsRemaining(draft.timeRemaining ?? 0);
    };

    const handleTimer = (...args: unknown[]): void => {
      const [payload] = args;
      const timerPayload = payload as SocketDraftTimerPayload;
      setSecondsRemaining(timerPayload.secondsRemaining);
    };

    const handleComplete = (...args: unknown[]): void => {
      const [payload] = args;
      void (payload as SocketDraftCompletePayload);
      setData((current) =>
        current
          ? {
              ...current,
              draft: {
                ...current.draft,
                status: 'COMPLETE',
                timeRemaining: 0,
              },
            }
          : current
      );
      setSecondsRemaining(0);
    };

    on('draft:state', handleDraftState);
    on('draft:timer', handleTimer);
    on('draft:complete', handleComplete);

    return () => {
      off('draft:state', handleDraftState);
      off('draft:timer', handleTimer);
      off('draft:complete', handleComplete);
    };
  }, [off, on]);

  const currentPickerUserId = useMemo(() => {
    if (!data?.draft || data.draft.status !== 'IN_PROGRESS') {
      return null;
    }

    return getCurrentPickerUserId(
      data.draft.draftOrder,
      data.draft.currentRound,
      data.draft.currentPickIndex
    );
  }, [data]);

  const draftedPlayerIds = useMemo(
    () => data?.draft.picks.map((pick) => pick.playerId) ?? [],
    [data]
  );

  const makePick = useCallback(
    async (playerId: string): Promise<void> => {
      const response = await fetch(`/api/leagues/${leagueId}/draft/pick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerId }),
      });
      const payload = (await response.json()) as { draft?: DraftStateResponse; error?: string };

      if (!response.ok || payload.error || !payload.draft) {
        throw new Error(payload.error ?? 'Failed to make draft pick');
      }

      setData((current) =>
        current
          ? {
              ...current,
              draft: payload.draft!,
              queue: filterQueueByDraftState(current.queue, payload.draft!),
            }
          : current
      );
      setSecondsRemaining(payload.draft.timeRemaining ?? 0);
    },
    [leagueId]
  );

  const updateQueue = useCallback(
    async (playerIds: string[]): Promise<void> => {
      const response = await fetch(`/api/leagues/${leagueId}/draft/queue`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerIds }),
      });
      const payload = (await response.json()) as { queue?: DraftQueueEntry[]; error?: string };

      if (!response.ok || payload.error || !payload.queue) {
        throw new Error(payload.error ?? 'Failed to update draft queue');
      }

      setData((current) =>
        current
          ? {
              ...current,
              queue: filterQueueByDraftState(payload.queue!, current.draft),
            }
          : current
      );
    },
    [leagueId]
  );

  const setDraftState = useCallback((draft: DraftStateResponse): void => {
    setData((current) =>
      current
        ? {
            ...current,
            draft,
            queue: filterQueueByDraftState(current.queue, draft),
          }
        : current
    );
    setSecondsRemaining(draft.timeRemaining ?? 0);
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    isMyTurn: currentPickerUserId === (data?.currentUserId ?? userId),
    currentPickerUserId,
    secondsRemaining,
    draftedPlayerIds,
    refresh,
    makePick,
    updateQueue,
    setDraftState,
  };
}
