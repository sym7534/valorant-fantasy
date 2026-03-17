'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import LeagueCard from '@/src/components/league/LeagueCard';
import Button from '@/src/components/ui/Button';
import EmptyState from '@/src/components/ui/EmptyState';
import ActivityFeed from '@/src/components/league/ActivityFeed';
import Spinner from '@/src/components/ui/Spinner';
import { MOCK_LEAGUES, MOCK_USER } from '@/src/lib/mock-data';

// TEMPORARY mock activities
const MOCK_ACTIVITIES = [
  { id: '1', type: 'draft_pick' as const, message: 'AcePlayer drafted TenZ (Sentinels) in Round 1', timestamp: '2026-03-16T22:00:00Z' },
  { id: '2', type: 'star_player' as const, message: 'PhoenixRush activated Shao as Star Player', timestamp: '2026-03-16T18:00:00Z' },
  { id: '3', type: 'lineup_change' as const, message: 'JettSetGo swapped Derke into active lineup', timestamp: '2026-03-16T12:00:00Z' },
  { id: '4', type: 'join' as const, message: 'OmenShadow joined Iron Lobby', timestamp: '2026-03-15T09:00:00Z' },
  { id: '5', type: 'score' as const, message: 'Week 2 scores are in! AcePlayer scored 768.8 pts', timestamp: '2026-03-14T20:00:00Z' },
];

export default function DashboardPage(): React.ReactElement {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
          Welcome back, <span className="text-[var(--accent-red)]">{user?.name ?? 'Player'}</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your leagues and track your fantasy teams
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="primary" size="md" onClick={() => router.push('/league/create')}>
          Create League
        </Button>
        <Button variant="secondary" size="md" onClick={() => router.push('/league/create')}>
          Join League
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* League cards */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            Your Leagues
          </h2>

          {MOCK_LEAGUES.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_LEAGUES.map((league, i) => (
                <div key={league.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 75}ms` }}>
                  <LeagueCard
                    league={league}
                    userRank={league.status === 'ACTIVE' ? i + 1 : undefined}
                    onClick={() => router.push(`/league/${league.id}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              title="No Leagues Yet"
              description="Create your own league or join one with an invite code to start building your dream VCT roster."
              actionLabel="Create a League"
              onAction={() => router.push('/league/create')}
            />
          )}
        </div>

        {/* Activity feed */}
        <div>
          <ActivityFeed activities={MOCK_ACTIVITIES} />
        </div>
      </div>
    </div>
  );
}
