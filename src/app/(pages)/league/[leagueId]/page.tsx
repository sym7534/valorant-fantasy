'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/src/components/ui/Badge';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import InviteCode from '@/src/components/league/InviteCode';
import Avatar from '@/src/components/ui/Avatar';
import Spinner from '@/src/components/ui/Spinner';
import { useAuth } from '@/src/hooks/useAuth';
import { useLeague } from '@/src/hooks/useLeague';
import { MIN_LEAGUE_SIZE } from '@/src/lib/game-config';

const statusVariant: Record<string, 'teal' | 'warning' | 'success' | 'muted'> = {
  SETUP: 'teal',
  DRAFTING: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'muted',
};

export default function LeaguePage(): React.ReactElement {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();
  const leagueId = params.leagueId;
  const { user } = useAuth();
  const { league, loading, error, refresh } = useLeague(leagueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStartingDraft, setIsStartingDraft] = useState(false);

  useEffect(() => {
    if (!leagueId) {
      return;
    }

    const interval = setInterval(() => {
      void refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [leagueId, refresh]);

  useEffect(() => {
    if (league?.status === 'DRAFTING') {
      router.push(`/league/${leagueId}/draft`);
    }
  }, [league?.status, leagueId, router]);

  const isCreator = league?.creatorId === user?.id;
  const canStartDraft = Boolean(
    isCreator && league?.status === 'SETUP' && league.members.length >= MIN_LEAGUE_SIZE
  );

  const draftOrder = useMemo(() => {
    if (!league?.draft?.draftOrder.length) {
      return [];
    }

    return league.draft.draftOrder
      .map((userId) => league.members.find((member) => member.userId === userId))
      .filter((member): member is NonNullable<typeof member> => Boolean(member));
  }, [league]);

  async function handleStartDraft(): Promise<void> {
    if (!league) {
      return;
    }

    setIsStartingDraft(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/leagues/${league.id}/draft/start`, {
        method: 'POST',
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to start draft');
      }

      router.push(`/league/${league.id}/draft`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to start draft');
    } finally {
      setIsStartingDraft(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Card className="p-6">
          <p className="text-sm text-[var(--status-error)]">{error ?? 'League not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
              {league.name}
            </h1>
            <Badge variant={statusVariant[league.status]} size="md">
              {league.status}
            </Badge>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {league.members.length} members, roster size {league.rosterSize}, {league.draftPickTime}s per pick.
          </p>
        </div>

        <InviteCode code={league.inviteCode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
              League Lobby
            </h2>
            <Badge variant="muted" size="md">
              Week {league.currentWeek}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {league.members.map((member, index) => (
              <div
                key={member.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className={`p-4 ${member.userId === user?.id ? 'border-[var(--accent-red)]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={member.user.name ?? 'Player'}
                      src={member.user.image}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {member.user.name ?? 'Unknown Player'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {member.isCreator && <Badge variant="gold" size="sm">Host</Badge>}
                        {member.userId === user?.id && <Badge variant="red" size="sm">You</Badge>}
                        <Badge variant="muted" size="sm">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-4">
            Draft Control
          </h2>

          {league.status === 'SETUP' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                The host can start the live snake draft once at least {MIN_LEAGUE_SIZE} members are in the lobby.
              </p>
              {isCreator ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void handleStartDraft()}
                  disabled={!canStartDraft}
                  isLoading={isStartingDraft}
                  className="w-full"
                >
                  {canStartDraft ? 'Start Draft' : `Need ${MIN_LEAGUE_SIZE} Members`}
                </Button>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Waiting for the host to start the draft.
                </p>
              )}
            </div>
          )}

          {league.status === 'DRAFTING' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                The draft is live now. Enter the draft room to see the board, queue players, and make picks on your turn.
              </p>
              <Button variant="primary" className="w-full" onClick={() => router.push(`/league/${league.id}/draft`)}>
                Enter Draft Room
              </Button>
            </div>
          )}

          {league.status === 'ACTIVE' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                The draft is complete. Set your weekly lineup and track the standings.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" className="flex-1" onClick={() => router.push(`/league/${league.id}/roster`)}>
                  My Roster
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => router.push(`/league/${league.id}/standings`)}>
                  Standings
                </Button>
              </div>
            </div>
          )}

          {actionError && (
            <p className="text-sm text-[var(--status-error)] mt-4">{actionError}</p>
          )}

          {draftOrder.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
                Draft Order
              </h3>
              <div className="space-y-2">
                {draftOrder.map((member, index) => (
                  <div key={member.id} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="w-7 text-[var(--accent-gold)] font-bold font-[family-name:var(--font-display)]">
                      {index + 1}
                    </span>
                    <Avatar name={member.user.name ?? 'Player'} src={member.user.image} size="sm" />
                    <span className="text-[var(--text-primary)]">{member.user.name ?? 'Unknown Player'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
