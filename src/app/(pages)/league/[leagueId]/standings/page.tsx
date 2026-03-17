'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Avatar from '@/src/components/ui/Avatar';
import Badge from '@/src/components/ui/Badge';
import Card from '@/src/components/ui/Card';
import Spinner from '@/src/components/ui/Spinner';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import { useAuth } from '@/src/hooks/useAuth';
import type { StandingEntry, StandingsResponse } from '@/src/lib/api-types';

function TrendBadge({ trend }: { trend: StandingEntry['trend'] }): React.ReactElement {
  if (trend === 'up') {
    return <Badge variant="success" size="sm">Up</Badge>;
  }

  if (trend === 'down') {
    return <Badge variant="error" size="sm">Down</Badge>;
  }

  return <Badge variant="muted" size="sm">Even</Badge>;
}

export default function StandingsPage(): React.ReactElement {
  const params = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStandings(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/leagues/${params.leagueId}/standings`, {
          cache: 'no-store',
        });
        const payload = (await response.json()) as StandingsResponse & { error?: string };

        if (!response.ok || payload.error) {
          throw new Error(payload.error ?? 'Failed to load standings');
        }

        if (!cancelled) {
          setData(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load standings');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStandings();

    return () => {
      cancelled = true;
    };
  }, [params.leagueId]);

  const allWeeks = useMemo(() => {
    const weekSet = new Set<number>();
    data?.standings.forEach((entry) => {
      entry.weeklyScores.forEach((score) => weekSet.add(score.weekNumber));
    });
    return Array.from(weekSet).sort((left, right) => left - right);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card className="p-6">
          <p className="text-sm text-[var(--status-error)]">{error ?? 'Failed to load standings'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
          Standings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Current week: {data.currentWeek}. Expand a row to inspect the lineup and weekly scoring breakdown.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
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
                  <th
                    key={week}
                    className="text-right px-3 py-3 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]"
                  >
                    W{week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.standings.map((entry) => {
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
                              <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
                                Current Lineup
                              </h2>
                              <div className="space-y-2">
                                {entry.currentLineup.length === 0 ? (
                                  <p className="text-sm text-[var(--text-secondary)]">
                                    No lineup saved for the current week.
                                  </p>
                                ) : (
                                  entry.currentLineup.map((slot) => (
                                    <div key={slot.id} className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] clip-angular-sm flex items-center gap-3">
                                      <RoleIcon role={slot.player.role} size="sm" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                          {slot.player.name}
                                        </p>
                                        <p className="text-xs text-[var(--text-secondary)]">{slot.player.team}</p>
                                      </div>
                                      <RegionFlag region={slot.player.region} size="sm" />
                                      {slot.isCaptain && <Badge variant="gold" size="sm">CPT</Badge>}
                                      {slot.isStarPlayer && <Badge variant="gold" size="sm">STAR</Badge>}
                                      <span className="text-sm text-[var(--accent-gold)] min-w-[56px] text-right">
                                        {slot.weeklyPoints?.toFixed(1) ?? '0.0'}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            <div>
                              <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
                                Weekly Scores
                              </h2>
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
    </div>
  );
}
