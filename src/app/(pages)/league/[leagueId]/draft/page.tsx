'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/src/components/ui/Badge';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Input from '@/src/components/ui/Input';
import Spinner from '@/src/components/ui/Spinner';
import Avatar from '@/src/components/ui/Avatar';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag, { regionBgTint } from '@/src/components/player/RegionFlag';
import { CrownIcon } from '@/src/components/player/PlayerCard';
import { useDraft } from '@/src/hooks/useDraft';
import { useAuth } from '@/src/hooks/useAuth';
import {
  PLAYER_ROLES,
  REGIONS,
  ROLE_SLOTS_BY_ROSTER_SIZE,
  type SlotType,
} from '@/src/lib/game-config';
import type { DraftPickEntry, PlayerSummary } from '@/src/lib/api-types';

function getDraftCellUserId(
  _round: number,
  memberIndex: number,
  draftOrder: string[]
): string {
  return draftOrder[memberIndex];
}

function getPlayerForPick(
  picks: DraftPickEntry[],
  round: number,
  userId: string
): DraftPickEntry | undefined {
  return picks.find((pick) => pick.round === round && pick.userId === userId);
}

export default function DraftPage(): React.ReactElement {
  const params = useParams<{ leagueId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const leagueId = params.leagueId;
  const {
    data,
    loading,
    error,
    isMyTurn,
    currentPickerUserId,
    secondsRemaining,
    draftedPlayerIds,
    makePick,
    updateQueue,
  } = useDraft(leagueId, user?.id ?? '');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | PlayerSummary['roles'][number]>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | PlayerSummary['region']>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingPick, setIsSubmittingPick] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);

  const currentUserId = data?.currentUserId ?? user?.id ?? '';
  const currentPicker = data?.members.find((member) => member.userId === currentPickerUserId) ?? null;
  const queueIds = data?.queue.map((entry) => entry.playerId) ?? [];
  const rosterConfig = data ? ROLE_SLOTS_BY_ROSTER_SIZE[data.league.rosterSize] : null;
  const myPicks = useMemo(
    () => data?.draft.picks.filter((pick) => pick.userId === currentUserId) ?? [],
    [currentUserId, data]
  );

  const filteredPlayers = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.players.filter((player) => {
      if (search) {
        const term = search.toLowerCase();
        const matchesSearch =
          player.name.toLowerCase().includes(term) || player.team.toLowerCase().includes(term);

        if (!matchesSearch) {
          return false;
        }
      }

      if (roleFilter !== 'all' && !player.roles.includes(roleFilter)) {
        return false;
      }

      if (regionFilter !== 'all' && player.region !== regionFilter) {
        return false;
      }

      return true;
    });
  }, [data, regionFilter, roleFilter, search]);

  async function handlePick(playerId: string): Promise<void> {
    setIsSubmittingPick(true);
    setActionError(null);

    try {
      await makePick(playerId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to make draft pick');
    } finally {
      setIsSubmittingPick(false);
    }
  }

  async function syncQueue(nextPlayerIds: string[]): Promise<void> {
    setQueueBusy(true);
    setActionError(null);

    try {
      await updateQueue(nextPlayerIds);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update queue');
    } finally {
      setQueueBusy(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {error ? (
          <Card className="p-6">
            <p className="text-sm text-[var(--status-error)]">{error}</p>
          </Card>
        ) : (
          <Spinner />
        )}
      </div>
    );
  }

  const isDraftComplete = data.draft.status === 'COMPLETE';
  const totalPicks = data.league.rosterSize * data.members.length;
  const currentPickNumber =
    (data.draft.currentRound - 1) * data.members.length + data.draft.currentPickIndex + 1;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col px-6 py-6 gap-4">
      {data.draft.currentRound === 1 && !isDraftComplete && (
        <div className="bg-[rgba(245,197,66,0.08)] border border-[rgba(245,197,66,0.2)] px-4 py-3 clip-angular-sm">
          <p className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent-gold)]">
            Captain Round. Your first pick becomes your permanent 2x captain.
          </p>
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Round</p>
              <p className="text-2xl font-bold font-[family-name:var(--font-display)]">
                {data.draft.currentRound} / {data.league.rosterSize}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Pick</p>
              <p className="text-2xl font-bold font-[family-name:var(--font-display)]">
                {Math.min(currentPickNumber, totalPicks)} / {totalPicks}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Direction</p>
              <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-teal)]">
                {data.draft.currentRound % 2 === 0 ? '←' : '→'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentPicker && !isDraftComplete && (
              <div className="flex items-center gap-3">
                <Avatar
                  name={currentPicker.user.name ?? 'Player'}
                  src={currentPicker.user.image}
                  size="md"
                />
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Now Picking</p>
                  <p className="text-sm font-bold font-[family-name:var(--font-display)] uppercase">
                    {isMyTurn ? 'Your Turn' : currentPicker.user.name ?? 'Unknown Player'}
                  </p>
                </div>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Timer</p>
              <p className={`text-3xl font-bold font-[family-name:var(--font-display)] ${secondsRemaining <= 10 ? 'text-[var(--accent-red)] animate-countdown-urgency' : 'text-[var(--text-primary)]'}`}>
                {isDraftComplete ? 'Done' : `${secondsRemaining}s`}
              </p>
            </div>
            <Badge variant="success" size="md">
              Live
            </Badge>
          </div>
        </div>
      </Card>

      {isDraftComplete && (
        <Card className="p-5 border-[rgba(74,222,128,0.2)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
                Draft Complete
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Every roster has been filled. Set your weekly lineup next.
              </p>
            </div>
            <Button variant="primary" onClick={() => router.push(`/league/${leagueId}/roster`)}>
              Go To My Roster
            </Button>
          </div>
        </Card>
      )}

      {actionError && (
        <Card className="p-4 border-[var(--status-error)]">
          <p className="text-sm text-[var(--status-error)]">{actionError}</p>
        </Card>
      )}

      <div className="grid grid-cols-[280px_minmax(0,1fr)_360px] gap-4 flex-1 min-h-0">
        <Card className="p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
              My Drafted Roster
            </h2>
            <Badge variant="muted" size="md">
              {myPicks.length} / {data.league.rosterSize}
            </Badge>
          </div>

          <div className="space-y-5">
            {rosterConfig && (
              <>
                {(['Duelist', 'Initiator', 'Controller', 'Sentinel', 'Wildcard'] as SlotType[]).map((slotType) => {
                  const limit = rosterConfig[slotType];
                  if (!limit) {
                    return null;
                  }

                  const slotPicks = myPicks.filter((pick) => pick.slotType === slotType);

                  return (
                    <div key={slotType}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                          {slotType}
                        </p>
                        <span className="text-xs text-[var(--text-muted)]">
                          {slotPicks.length}/{limit}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Array.from({ length: limit }, (_, index) => {
                          const pick = slotPicks[index];

                          return (
                            <div key={`${slotType}-${index}`} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm">
                              {pick ? (
                                <div className="flex items-center gap-2">
                                  <RoleIcon role={pick.player.roles[0]} size="sm" />
                                  <span className="flex-1 text-sm font-semibold text-[var(--text-primary)] truncate">
                                    {pick.player.name}
                                  </span>
                                  {pick.isCaptain && <CrownIcon size={14} />}
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--text-muted)]">Open slot</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div>
              <p className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Region Spread
              </p>
              <div className="grid grid-cols-2 gap-2">
                {REGIONS.map((region) => {
                  const count = myPicks.filter((pick) => pick.player.region === region).length;
                  return (
                    <div key={region} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <RegionFlag region={region} size="sm" />
                      <span>{region}</span>
                      <span className="text-[var(--text-primary)]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-rows-[minmax(0,1fr)_220px] gap-4 min-h-0">
          <Card className="p-4 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)] px-2 py-2">
                    Rd
                  </th>
                  {data.draft.draftOrder.map((memberUserId) => {
                    const member = data.members.find((entry) => entry.userId === memberUserId);
                    return (
                      <th
                        key={memberUserId}
                        className={`text-left text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider px-2 py-2 ${memberUserId === currentUserId ? 'text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'}`}
                      >
                        {member?.user.name ?? 'Player'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: data.league.rosterSize }, (_, index) => {
                  const round = index + 1;

                  return (
                    <tr key={round} className="border-t border-[var(--border-subtle)]">
                      <td className="px-2 py-2 text-sm font-bold font-[family-name:var(--font-display)] text-[var(--text-muted)]">
                        {round}
                      </td>
                      {data.draft.draftOrder.map((_, memberIndex) => {
                        const userIdForCell = getDraftCellUserId(round, memberIndex, data.draft.draftOrder);
                        const pick = getPlayerForPick(data.draft.picks, round, userIdForCell);
                        const isCurrentCell =
                          !isDraftComplete &&
                          round === data.draft.currentRound &&
                          userIdForCell === currentPickerUserId;

                        return (
                          <td key={`${round}-${userIdForCell}`} className="px-2 py-2 align-top">
                            <div className={`min-h-[74px] px-3 py-2 clip-angular-sm border ${isCurrentCell ? 'border-[var(--accent-red)] bg-[rgba(255,70,85,0.06)] animate-pulse-red' : 'border-[var(--border-subtle)] bg-[var(--bg-primary)]'}`}>
                              {pick ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <RoleIcon role={pick.player.roles[0]} size="sm" />
                                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                      {pick.player.name}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[var(--text-secondary)] truncate">
                                    {pick.player.team}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <RegionFlag region={pick.player.region} size="sm" />
                                    {pick.isCaptain && <CrownIcon size={14} />}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center">
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {isCurrentCell ? 'Picking…' : 'Open'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card className="p-4 overflow-y-auto">
            <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-3">
              Draft Log
            </h2>
            <div className="space-y-2">
              {data.draft.picks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Waiting for the first pick.</p>
              ) : (
                data.draft.picks
                  .slice()
                  .reverse()
                  .map((pick) => (
                    <div key={pick.id} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm text-sm">
                      <span className="text-[var(--accent-teal)]">{pick.user.name ?? 'Player'}</span>{' '}
                      drafted{' '}
                      <span className="text-[var(--text-primary)] font-semibold">{pick.player.name}</span>
                      {' '}in round {pick.round}.
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-rows-[220px_minmax(0,1fr)] gap-4 min-h-0">
          <Card className="p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
                Priority Queue
              </h2>
              <Badge variant="muted" size="md">
                {data.queue.length} queued
              </Badge>
            </div>
            <div className="space-y-2">
              {data.queue.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Queue players to auto-pick them if your timer expires.
                </p>
              ) : (
                data.queue.map((entry, index) => (
                  <div key={entry.id} className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                        {index + 1}
                      </span>
                      <RoleIcon role={entry.player.roles[0]} size="sm" />
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                        {entry.player.name}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        disabled={queueBusy || index === 0}
                        onClick={() => {
                          const next = queueIds.slice();
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          void syncQueue(next);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        disabled={queueBusy || index === queueIds.length - 1}
                        onClick={() => {
                          const next = queueIds.slice();
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          void syncQueue(next);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-xs text-[var(--accent-red)]"
                        disabled={queueBusy}
                        onClick={() => void syncQueue(queueIds.filter((playerId) => playerId !== entry.playerId))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-4 flex flex-col min-h-0">
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
                  Player Pool
                </h2>
                <Badge variant="muted" size="md">
                  {filteredPlayers.length} visible
                </Badge>
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search player or team"
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${roleFilter === 'all' ? 'bg-[var(--accent-red)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                  onClick={() => setRoleFilter('all')}
                >
                  All Roles
                </button>
                {PLAYER_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${roleFilter === role ? 'bg-[var(--accent-red)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                    onClick={() => setRoleFilter((current: typeof roleFilter) => (current === role ? 'all' : role))}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${regionFilter === 'all' ? 'bg-[var(--accent-teal)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                  onClick={() => setRegionFilter('all')}
                >
                  All Regions
                </button>
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${regionFilter === region ? 'bg-[var(--accent-teal)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}
                    onClick={() => setRegionFilter((current) => (current === region ? 'all' : region))}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredPlayers.map((player) => {
                const isDrafted = draftedPlayerIds.includes(player.id);
                const isQueued = queueIds.includes(player.id);

                return (
                  <div key={player.id} className={`px-3 py-3 border clip-angular-sm ${isDrafted ? 'border-[var(--border-subtle)] opacity-50' : 'border-[var(--border-default)]'}`} style={{ backgroundColor: isDrafted ? 'var(--bg-primary)' : regionBgTint[player.region] }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <RoleIcon role={player.roles[0]} size="sm" />
                          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {player.name}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{player.team}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <RegionFlag region={player.region} size="sm" />
                          <Badge variant="muted" size="sm">{player.roles.length > 1 ? player.roles.map((r: string) => r[0]).join('/') : player.roles[0]}</Badge>
                          {isDrafted && <Badge variant="warning" size="sm">Drafted</Badge>}
                          {isQueued && !isDrafted && <Badge variant="teal" size="sm">Queued</Badge>}
                        </div>
                      </div>

                      {!isDrafted && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={queueBusy || isQueued}
                            onClick={() => void syncQueue([...queueIds, player.id])}
                          >
                            {isQueued ? 'Queued' : 'Queue'}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!isMyTurn || isSubmittingPick || isDraftComplete}
                            isLoading={isSubmittingPick}
                            onClick={() => void handlePick(player.id)}
                          >
                            Draft
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
