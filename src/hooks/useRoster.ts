'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  RosterLineupResponse,
  RosterResponse,
  RosterStarResponse,
} from '@/src/lib/api-types';

type UseRosterReturn = {
  roster: RosterResponse | null;
  loading: boolean;
  error: string | null;
  refresh: (overrideWeekNumber?: number) => Promise<void>;
  submitLineup: (playerIds: string[], weekNumber?: number) => Promise<RosterResponse>;
  activateStar: (playerId: string, weekNumber?: number) => Promise<RosterResponse>;
};

type ApiErrorResponse = {
  error?: string;
};

export function useRoster(
  leagueId: string | null,
  weekNumber?: number
): UseRosterReturn {
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (overrideWeekNumber?: number): Promise<void> => {
      if (!leagueId) {
        setRoster(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const selectedWeek = overrideWeekNumber ?? weekNumber;
      const search = selectedWeek ? `?week=${selectedWeek}` : '';

      try {
        const response = await fetch(`/api/leagues/${leagueId}/roster${search}`, {
          cache: 'no-store',
        });
        const data = (await response.json()) as RosterResponse & ApiErrorResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error ?? 'Failed to load roster');
        }

        setRoster(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load roster');
      } finally {
        setLoading(false);
      }
    },
    [leagueId, weekNumber]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitLineup = useCallback(
    async (playerIds: string[], targetWeekNumber?: number): Promise<RosterResponse> => {
      if (!leagueId) {
        throw new Error('League is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/roster/lineup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerIds,
          weekNumber: targetWeekNumber ?? weekNumber,
        }),
      });
      const data = (await response.json()) as RosterLineupResponse & ApiErrorResponse;

      if (!response.ok || data.error || !data.roster) {
        throw new Error(data.error ?? 'Failed to save lineup');
      }

      setRoster(data.roster);
      setError(null);
      return data.roster;
    },
    [leagueId, weekNumber]
  );

  const activateStar = useCallback(
    async (playerId: string, targetWeekNumber?: number): Promise<RosterResponse> => {
      if (!leagueId) {
        throw new Error('League is required');
      }

      const response = await fetch(`/api/leagues/${leagueId}/roster/star`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          weekNumber: targetWeekNumber ?? weekNumber,
        }),
      });
      const data = (await response.json()) as RosterStarResponse & ApiErrorResponse;

      if (!response.ok || data.error || !data.roster) {
        throw new Error(data.error ?? 'Failed to activate star player');
      }

      setRoster(data.roster);
      setError(null);
      return data.roster;
    },
    [leagueId, weekNumber]
  );

  return {
    roster,
    loading,
    error,
    refresh,
    submitLineup,
    activateStar,
  };
}
