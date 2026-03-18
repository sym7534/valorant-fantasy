'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/src/components/ui/Badge';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import InviteCode from '@/src/components/league/InviteCode';
import Avatar from '@/src/components/ui/Avatar';
import Spinner from '@/src/components/ui/Spinner';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import { CrownIcon, StarIcon } from '@/src/components/player/PlayerCard';
import { useAuth } from '@/src/hooks/useAuth';
import { useLeague } from '@/src/hooks/useLeague';
import { MIN_LEAGUE_SIZE } from '@/src/lib/game-config';
import type { StandingEntry, StandingsResponse } from '@/src/lib/api-types';

const statusVariant: Record<string, 'teal' | 'warning' | 'success' | 'muted'> = {
  SETUP: 'teal',
  DRAFTING: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'muted',
};

function TrendBadge({ trend }: { trend: StandingEntry['trend'] }): React.ReactElement {
  if (trend === 'up') return <Badge variant="success" size="sm">Up</Badge>;
  if (trend === 'down') return <Badge variant="error" size="sm">Down</Badge>;
  return <Badge variant="muted" size="sm">Even</Badge>;
}

export default function LeaguePage(): React.ReactElement {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();
  const leagueId = params.leagueId;
  const { user } = useAuth();
  const { league, loading, error, refresh } = useLeague(leagueId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStartingDraft, setIsStartingDraft] = useState(false);

  // Standings state
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    const interval = setInterval(() => { void refresh(); }, 5000);
    return () => clearInterval(interval);
  }, [leagueId, refresh]);

  useEffect(() => {
    if (league?.status === 'DRAFTING') {
      router.push(`/league/${leagueId}/draft`);
    }
  }, [league?.status, leagueId, router]);

  // Load standings when league is ACTIVE
  const loadStandings = useCallback(async (): Promise<void> => {
    if (!leagueId) return;
    setStandingsLoading(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/standings`, { cache: 'no-store' });
      const payload = (await response.json()) as StandingsResponse & { error?: string };
      if (response.ok && !payload.error) {
        setStandings(payload);
      }
    } catch {
      // Silently fail — standings are supplemental
    } finally {
      setStandingsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    if (league?.status === 'ACTIVE' || league?.status === 'COMPLETED') {
      void loadStandings();
    }
  }, [league?.status, loadStandings]);

  const isCreator = league?.creatorId === user?.id;
  const canStartDraft = Boolean(
    isCreator && league?.status === 'SETUP' && league.members.length >= MIN_LEAGUE_SIZE
  );

  const draftOrder = useMemo(() => {
    if (!league?.draft?.draftOrder.length) return [];
    return league.draft.draftOrder
      .map((userId) => league.members.find((member) => member.userId === userId))
      .filter((member): member is NonNullable<typeof member> => Boolean(member));
  }, [league]);

  const allWeeks = useMemo(() => {
    const weekSet = new Set<number>();
    standings?.standings.forEach((entry) => {
      entry.weeklyScores.forEach((score) => weekSet.add(score.weekNumber));
    });
    return Array.from(weekSet).sort((left, right) => left - right);
  }, [standings]);

  async function handleStartDraft(): Promise<void> {
    if (!league) return;
    setIsStartingDraft(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/leagues/${league.id}/draft/start`, { method: 'POST' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Failed to start draft');
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
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

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
              Members
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
                    <Avatar name={member.user.name ?? 'Player'} src={member.user.image} size="md" />
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

        {/* Draft Control */}
        <Card className="p-6">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-4">
            {league.status === 'ACTIVE' ? 'Quick Links' : 'Draft Control'}
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

          {(league.status === 'ACTIVE' || league.status === 'COMPLETED') && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                The draft is complete. Set your weekly lineup and track the standings below.
              </p>
              <Button variant="primary" className="w-full" onClick={() => router.push(`/league/${league.id}/roster`)}>
                My Roster
              </Button>
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

      {/* Standings (shown when league is ACTIVE or COMPLETED) */}
      {(league.status === 'ACTIVE' || league.status === 'COMPLETED') && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Standings
          </h2>

          {standingsLoading && !standings && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          )}

          {standings && (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)]">
                      <th className="text-left px-4 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                        Rank
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                        Manager
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                        Week
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                        Trend
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                        Total
                      </th>
                      {allWeeks.map((week) => (
                        <th key={week} className="text-right px-3 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                          W{week}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.standings.map((entry) => {
                      const isExpanded = expandedUserId === entry.userId;
                      const isCurrentUser = entry.userId === user?.id;

                      return (
                        <React.Fragment key={entry.userId}>
                          <tr
                            className={`border-b border-[var(--border-subtle)] cursor-pointer ${isCurrentUser ? 'bg-[rgba(255,70,85,0.06)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                            onClick={() => setExpandedUserId((current) => (current === entry.userId ? null : entry.userId))}
                          >
                            <td className="px-4 py-4">
                              <span className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                                {entry.rank}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={entry.user.name ?? 'Player'} src={entry.user.image} size="sm" />
                                <div>
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {entry.user.name ?? 'Unknown Player'}
                                  </p>
                                  {isCurrentUser && <Badge variant="red" size="sm">You</Badge>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-[var(--text-primary)]">
                              {entry.currentWeekPoints.toFixed(1)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <TrendBadge trend={entry.trend} />
                            </td>
                            <td className="px-4 py-4 text-right text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                              {entry.totalPoints.toFixed(1)}
                            </td>
                            {allWeeks.map((week) => {
                              const weeklyScore = entry.weeklyScores.find((score) => score.weekNumber === week);
                              return (
                                <td key={week} className="px-3 py-4 text-right text-sm text-[var(--text-secondary)]">
                                  {weeklyScore ? weeklyScore.totalPoints.toFixed(1) : '—'}
                                </td>
                              );
                            })}
                          </tr>

                          {isExpanded && (
                            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                              <td colSpan={5 + allWeeks.length} className="px-6 py-5">
                                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
                                  <div>
                                    <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
                                      Current Lineup
                                    </h3>
                                    <div className="space-y-2">
                                      {entry.currentLineup.length === 0 ? (
                                        <p className="text-sm text-[var(--text-secondary)]">No lineup saved for the current week.</p>
                                      ) : (
                                        entry.currentLineup.map((slot) => (
                                          <div key={slot.id} className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] clip-angular-sm flex items-center gap-3">
                                            <RoleIcon role={slot.player.roles[0]} size="sm" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-[var(--text-primary)]">{slot.player.name}</p>
                                              <p className="text-xs text-[var(--text-secondary)]">{slot.player.team}</p>
                                            </div>
                                            <RegionFlag region={slot.player.region} size="sm" />
                                            {slot.isCaptain && <CrownIcon size={14} />}
                                            {slot.isStarPlayer && <StarIcon size={14} />}
                                            <span className="text-sm text-[var(--accent-gold)] min-w-[56px] text-right">
                                              {slot.weeklyPoints?.toFixed(1) ?? '0.0'}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
                                      Weekly Scores
                                    </h3>
                                    <div className="space-y-3">
                                      {entry.weeklyScores.map((weeklyScore) => (
                                        <Card key={weeklyScore.weekNumber} className="p-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
                                              Week {weeklyScore.weekNumber}
                                            </span>
                                            <span className="text-sm text-[var(--accent-gold)]">
                                              {weeklyScore.totalPoints.toFixed(1)} pts
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {weeklyScore.breakdown.map((breakdown) => (
                                              <Badge key={`${weeklyScore.weekNumber}-${breakdown.playerId}`} variant="muted" size="sm">
                                                {breakdown.playerName}: {breakdown.finalScore.toFixed(1)}
                                              </Badge>
                                            ))}
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
