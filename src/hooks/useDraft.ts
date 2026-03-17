'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';
import type { DraftState, DraftPick } from '@/src/lib/mock-data';
import { MOCK_DRAFT_STATE, MOCK_DRAFT_PICKS, MOCK_PLAYERS } from '@/src/lib/mock-data';

interface UseDraftReturn {
  draftState: DraftState | null;
  isMyTurn: boolean;
  secondsRemaining: number;
  makePick: (playerId: string) => void;
  isConnected: boolean;
  draftedPlayerIds: string[];
}

export function useDraft(leagueId: string, userId: string): UseDraftReturn {
  void leagueId;
  const { isConnected, emit } = useSocket();

  // TEMPORARY: Use mock data. Replace with socket events when backend is ready.
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    // Simulate receiving draft state
    const timer = setTimeout(() => {
      setDraftState(MOCK_DRAFT_STATE);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Mock countdown
  useEffect(() => {
    if (!draftState || draftState.status !== 'IN_PROGRESS') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [draftState]);

  const currentDrafter = draftState
    ? draftState.currentRound % 2 === 1
      ? draftState.draftOrder[draftState.currentPickIndex]
      : draftState.draftOrder[draftState.draftOrder.length - 1 - draftState.currentPickIndex]
    : null;

  const isMyTurn = currentDrafter === userId;

  const draftedPlayerIds = draftState?.picks.map((p) => p.playerId) ?? [];

  const makePick = useCallback(
    (playerId: string): void => {
      if (!isMyTurn || !draftState) return;

      const player = MOCK_PLAYERS.find((p) => p.id === playerId);
      if (!player) return;

      // BLOCKED: Replace with socket emit
      emit('draft:pick', { leagueId, playerId });

      // Optimistic update for mock
      const newPick: DraftPick = {
        id: `dp-${Date.now()}`,
        userId,
        userName: 'AcePlayer',
        playerId,
        playerName: player.name,
        playerTeam: player.team,
        playerRole: player.role,
        playerRegion: player.region,
        round: draftState.currentRound,
        pickNumber: MOCK_DRAFT_PICKS.length + 1,
        isCaptain: draftState.currentRound === 1,
        pickedAt: new Date().toISOString(),
      };

      setDraftState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          picks: [...prev.picks, newPick],
          currentPickIndex: prev.currentPickIndex + 1,
        };
      });
      setSecondsRemaining(60);
    },
    [isMyTurn, draftState, emit, leagueId, userId]
  );

  return {
    draftState,
    isMyTurn,
    secondsRemaining,
    makePick,
    isConnected,
    draftedPlayerIds,
  };
}
