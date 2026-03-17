'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LeagueDetail } from '@/src/lib/api-types';

type UseLeagueReturn = {
  league: LeagueDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useLeague(leagueId: string | null): UseLeagueReturn {
  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!leagueId) {
      setLeague(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leagues/${leagueId}`, { cache: 'no-store' });
      const data = (await response.json()) as { league?: LeagueDetail; error?: string };

      if (!response.ok || !data.league) {
        throw new Error(data.error ?? 'Failed to load league');
      }

      setLeague(data.league);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load league');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    league,
    loading,
    error,
    refresh,
  };
}
