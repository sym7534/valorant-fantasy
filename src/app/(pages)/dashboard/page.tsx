'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import type { LeagueListResponse } from '@/src/lib/api-types';
import LeagueCard from '@/src/components/league/LeagueCard';
import Button from '@/src/components/ui/Button';
import ActivityFeed from '@/src/components/league/ActivityFeed';
import Spinner from '@/src/components/ui/Spinner';
import Card from '@/src/components/ui/Card';

export default function DashboardPage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<LeagueListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let cancelled = false;

    async function loadDashboard(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/leagues', { cache: 'no-store' });
        const payload = (await response.json()) as LeagueListResponse & { error?: string };

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? 'Failed to load dashboard');
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Welcome back, <span className="text-[var(--accent-red)]">{user?.name ?? 'Manager'}</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create a private league, jump into a live snake draft, and manage your weekly VCT lineup.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={() => router.push('/league/create')}>
            Create League
          </Button>
          <Button variant="secondary" size="md" onClick={() => router.push('/league/join')}>
            Join League
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 p-4 border-[var(--status-error)]">
          <p className="text-sm text-[var(--status-error)]">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6">
        <section>
          <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Your Leagues
          </h2>

          {data?.leagues.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.leagues.map((league, index) => (
                <div key={league.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                  <LeagueCard
                    league={league}
                    onClick={() => router.push(`/league/${league.id}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
                No leagues yet
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Start a private lobby for your group or join an existing one with an invite code.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="primary" onClick={() => router.push('/league/create')}>
                  Create League
                </Button>
                <Button variant="secondary" onClick={() => router.push('/league/join')}>
                  Join League
                </Button>
              </div>
            </Card>
          )}
        </section>

        <section>
          <ActivityFeed activities={data?.activity ?? []} />
        </section>
      </div>
    </div>
  );
}
