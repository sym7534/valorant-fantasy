'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Badge from '@/src/components/ui/Badge';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import Spinner from '@/src/components/ui/Spinner';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import { useRoster } from '@/src/hooks/useRoster';
import { ACTIVE_LINEUP_SIZE } from '@/src/lib/game-config';

export default function RosterPage(): React.ReactElement {
  const params = useParams<{ leagueId: string }>();
  const leagueId = params.leagueId;
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);
  const [showStarSelector, setShowStarSelector] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivatingStar, setIsActivatingStar] = useState(false);
  const { roster, loading, error, submitLineup, activateStar } = useRoster(leagueId, selectedWeek);

  useEffect(() => {
    if (roster && selectedWeek === undefined) {
      setSelectedWeek(roster.selectedWeek);
    }
  }, [roster, selectedWeek]);

  useEffect(() => {
    if (!roster) {
      return;
    }

    const nextActiveIds =
      roster.activeLineup?.slots.map((slot) => slot.player.id) ??
      roster.players.slice(0, ACTIVE_LINEUP_SIZE).map((player) => player.playerId);

    setActivePlayerIds(nextActiveIds);
  }, [roster]);

  const activePlayers = useMemo(() => {
    if (!roster) {
      return [];
    }

    const playerMap = new Map(roster.players.map((player) => [player.playerId, player]));
    return activePlayerIds
      .map((playerId) => playerMap.get(playerId))
      .filter((player): player is NonNullable<typeof player> => Boolean(player));
  }, [activePlayerIds, roster]);

  const benchPlayers = useMemo(() => {
    if (!roster) {
      return [];
    }

    const activeSet = new Set(activePlayerIds);
    return roster.players.filter((player) => !activeSet.has(player.playerId));
  }, [activePlayerIds, roster]);

  const currentWeekSummary = roster?.weekSummaries.find((week) => week.weekNumber === roster.selectedWeek) ?? null;
  const isLocked = Boolean(currentWeekSummary?.isLineupLocked || roster?.activeLineup?.isLocked);
  const currentStarPlayerId =
    roster?.activeLineup?.slots.find((slot) => slot.isStarPlayer)?.player.id ?? null;

  function benchPlayer(playerId: string): void {
    if (isLocked) {
      setActionError('This week is locked.');
      return;
    }

    const player = activePlayers.find((entry) => entry.playerId === playerId);
    if (!player || player.isCaptain) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setActivePlayerIds((current) => current.filter((id) => id !== playerId));
  }

  function activatePlayer(playerId: string): void {
    if (isLocked) {
      setActionError('This week is locked.');
      return;
    }

    if (activePlayerIds.includes(playerId)) {
      return;
    }

    if (activePlayerIds.length >= ACTIVE_LINEUP_SIZE) {
      setActionError('Bench a non-captain player first. The lineup must stay at 5 players.');
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setActivePlayerIds((current) => [...current, playerId]);
  }

  async function handleSaveLineup(): Promise<void> {
    if (!roster) {
      return;
    }

    setIsSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await submitLineup(activePlayerIds, roster.selectedWeek);
      setActionMessage('Lineup saved.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to save lineup');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivateStar(playerId: string): Promise<void> {
    if (!roster) {
      return;
    }

    setIsActivatingStar(true);
    setActionError(null);
    setActionMessage(null);

    try {
      await activateStar(playerId, roster.selectedWeek);
      setActionMessage('Star player activated.');
      setShowStarSelector(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to activate star player');
    } finally {
      setIsActivatingStar(false);
    }
  }

  if (loading || !roster) {
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            My Roster
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {roster.leagueName}, week {roster.selectedWeek}. Manual admin lock is {isLocked ? 'active' : 'open'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowStarSelector((current) => !current)}
            disabled={isLocked || activePlayers.filter((player) => !player.isCaptain && player.starCooldownWeeksLeft === 0).length === 0}
          >
            Activate Star Player
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSaveLineup()}
            disabled={isLocked || activePlayerIds.length !== ACTIVE_LINEUP_SIZE}
            isLoading={isSaving}
          >
            Save Lineup
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {roster.weekSummaries.map((week) => (
          <button
            key={week.weekNumber}
            type="button"
            onClick={() => {
              setActionError(null);
              setActionMessage(null);
              setSelectedWeek(week.weekNumber);
            }}
            className={`px-4 py-2 clip-angular-sm border text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider ${week.weekNumber === roster.selectedWeek ? 'bg-[var(--accent-red)] text-[var(--text-on-accent)] border-[var(--accent-red)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-default)]'}`}
          >
            Week {week.weekNumber}
          </button>
        ))}
      </div>

      {actionError && (
        <Card className="p-4 border-[var(--status-error)]">
          <p className="text-sm text-[var(--status-error)]">{actionError}</p>
        </Card>
      )}

      {actionMessage && (
        <Card className="p-4 border-[rgba(74,222,128,0.2)]">
          <p className="text-sm text-[var(--status-success)]">{actionMessage}</p>
        </Card>
      )}

      {showStarSelector && (
        <Card className="p-5">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] mb-4">
            Choose This Week&apos;s Star
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {activePlayers
              .filter((player) => !player.isCaptain)
              .map((player) => {
                const unavailable = player.starCooldownWeeksLeft > 0;

                return (
                  <div key={player.id} className="p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <RoleIcon role={player.player.role} size="sm" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{player.player.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <RegionFlag region={player.player.region} size="sm" />
                      {currentStarPlayerId === player.playerId && <Badge variant="gold" size="sm">Current Star</Badge>}
                      {unavailable && <Badge variant="warning" size="sm">Cooldown {player.starCooldownWeeksLeft}w</Badge>}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      disabled={unavailable || currentStarPlayerId === player.playerId}
                      isLoading={isActivatingStar && currentStarPlayerId !== player.playerId}
                      onClick={() => void handleActivateStar(player.playerId)}
                    >
                      {currentStarPlayerId === player.playerId ? 'Active' : 'Set Star'}
                    </Button>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Hero View</p>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
              Active Lineup
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Weekly Total</p>
            <p className="text-4xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
              {roster.weeklyScore?.totalPoints.toFixed(1) ?? '0.0'}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="absolute inset-0 bg-atmospheric opacity-80" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-5 gap-4 p-6">
            {Array.from({ length: ACTIVE_LINEUP_SIZE }, (_, index) => {
              const player = activePlayers[index];

              return (
                <div
                  key={player?.id ?? `empty-${index}`}
                  className={`clip-angular border min-h-[320px] p-4 transition-all duration-150 ${player ? 'bg-[var(--bg-secondary)] border-[var(--border-default)]' : 'bg-[rgba(36,52,71,0.35)] border-dashed border-[var(--border-subtle)]'} ${index === 2 ? '-mt-3' : index === 0 || index === 4 ? 'mt-4' : ''}`}
                >
                  {player ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <RegionFlag region={player.player.region} size="sm" />
                        <div className="flex gap-2">
                          {player.isCaptain && <Badge variant="gold" size="sm">Captain</Badge>}
                          {currentStarPlayerId === player.playerId && <Badge variant="gold" size="sm">Star</Badge>}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="h-28 mb-4 bg-[var(--bg-tertiary)] clip-angular-sm flex items-center justify-center">
                          <RoleIcon role={player.player.role} size="lg" />
                        </div>
                        <h3 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
                          {player.player.name}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{player.player.team}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Role</p>
                            <p className="text-[var(--text-primary)]">{player.player.role}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Points</p>
                            <p className="text-[var(--accent-gold)] font-bold">
                              {player.weeklyPoints?.toFixed(1) ?? '0.0'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!player.isCaptain && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLocked}
                          onClick={() => benchPlayer(player.playerId)}
                        >
                          Bench
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-sm text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase tracking-wider">
                        Open Slot
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Bench
          </h2>
          <Badge variant="muted" size="md">
            {benchPlayers.length} players
          </Badge>
        </div>
        <div className="space-y-2">
          {benchPlayers.map((player) => (
            <div key={player.id} className="px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm flex items-center gap-3">
              <RoleIcon role={player.player.role} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {player.player.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {player.player.team}
                </p>
              </div>
              <RegionFlag region={player.player.region} size="sm" />
              {player.starCooldownWeeksLeft > 0 && (
                <Badge variant="warning" size="sm">
                  CD {player.starCooldownWeeksLeft}w
                </Badge>
              )}
              <Badge variant="muted" size="sm">{player.slotType}</Badge>
              <Button
                variant="secondary"
                size="sm"
                disabled={isLocked}
                onClick={() => activatePlayer(player.playerId)}
              >
                Start
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Weekly Breakdown
          </h2>
          <Badge variant="muted" size="md">
            {roster.weeklyScore ? `${roster.weeklyScore.totalPoints.toFixed(1)} pts` : 'No score yet'}
          </Badge>
        </div>

        {roster.weeklyScore ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left px-3 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                    Player
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                    Base
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                    Multiplier
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
                    Final
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.weeklyScore.breakdown.map((entry) => (
                  <tr key={entry.playerId} className="border-b border-[var(--border-subtle)]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-primary)]">{entry.playerName}</span>
                        {entry.designation !== 'normal' && (
                          <Badge variant="gold" size="sm">
                            {entry.designation}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-[var(--text-secondary)]">
                      {entry.baseScore.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-[var(--accent-gold)]">
                      {entry.multiplier}x
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-[var(--text-primary)] font-semibold">
                      {entry.finalScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Scores will appear here once stats are imported for the selected week.
          </p>
        )}
      </Card>
    </div>
  );
}
