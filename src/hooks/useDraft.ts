'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DraftGetResponse,
  DraftQueueEntry,
  DraftStateResponse,
} from '@/src/lib/api-types';

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

const POLL_INTERVAL_ACTIVE = 2000;
const POLL_INTERVAL_IDLE = 10000;

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
  const [data, setData] = useState<DraftGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const lastServerTimeRef = useRef<{ timeRemaining: number; fetchedAt: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!leagueId) {
      setData(null);
      setLoading(false);
      return;
    }

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

      const serverTime = payload.draft.timeRemaining ?? 0;
      lastServerTimeRef.current = { timeRemaining: serverTime, fetchedAt: Date.now() };
      setSecondsRemaining(serverTime);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft');
    }
  }, [leagueId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Client-side countdown timer (ticks every second based on last server time)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!lastServerTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - lastServerTimeRef.current.fetchedAt) / 1000);
      const remaining = Math.max(0, lastServerTimeRef.current.timeRemaining - elapsed);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Polling for draft state updates
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    const isActive = data?.draft.status === 'IN_PROGRESS';
    const interval = isActive ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;

    // Don't poll if draft is complete or waiting
    if (data?.draft.status === 'COMPLETE') {
      return;
    }

    pollRef.current = setInterval(() => {
      void refresh();
    }, interval);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.draft.status, refresh]);

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
      const serverTime = payload.draft.timeRemaining ?? 0;
      lastServerTimeRef.current = { timeRemaining: serverTime, fetchedAt: Date.now() };
      setSecondsRemaining(serverTime);
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
    const serverTime = draft.timeRemaining ?? 0;
    lastServerTimeRef.current = { timeRemaining: serverTime, fetchedAt: Date.now() };
    setSecondsRemaining(serverTime);
  }, []);

  return {
    data,
    loading,
    error,
    isConnected: true, // Always "connected" with polling
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
