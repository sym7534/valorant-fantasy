'use client';

import React, { useState, useMemo } from 'react';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import type { Player, PlayerMatchStats } from '@/src/lib/mock-data';
import type { PlayerRole, Region } from '@/src/lib/game-config';

interface PlayerWithFullStats extends Player {
  gamesPlayed: number;
  avgStats: PlayerMatchStats;
  fantasyPoints: number;
}

interface PlayerStatsTableProps {
  players: PlayerWithFullStats[];
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

type SortKey = 'name' | 'team' | 'gamesPlayed' | 'kills' | 'deaths' | 'kd' | 'assists' | 'firstKills' | 'firstDeaths' | 'adr' | 'fantasyPoints';
type SortDir = 'asc' | 'desc';

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Player', align: 'left' },
  { key: 'team', label: 'Team', align: 'left' },
  { key: 'gamesPlayed', label: 'GP', align: 'right' },
  { key: 'kills', label: 'K', align: 'right' },
  { key: 'deaths', label: 'D', align: 'right' },
  { key: 'kd', label: 'K/D', align: 'right' },
  { key: 'assists', label: 'A', align: 'right' },
  { key: 'firstKills', label: 'FK', align: 'right' },
  { key: 'firstDeaths', label: 'FD', align: 'right' },
  { key: 'adr', label: 'ADR', align: 'right' },
  { key: 'fantasyPoints', label: 'FPts', align: 'right' },
];

function getSortValue(player: PlayerWithFullStats, key: SortKey): number | string {
  switch (key) {
    case 'name': return player.name;
    case 'team': return player.team;
    case 'gamesPlayed': return player.gamesPlayed;
    case 'kills': return player.avgStats.kills;
    case 'deaths': return player.avgStats.deaths;
    case 'kd': return player.avgStats.deaths > 0 ? player.avgStats.kills / player.avgStats.deaths : player.avgStats.kills;
    case 'assists': return player.avgStats.assists;
    case 'firstKills': return player.avgStats.firstKills;
    case 'firstDeaths': return player.avgStats.firstDeaths;
    case 'adr': return player.avgStats.adr;
    case 'fantasyPoints': return player.fantasyPoints;
  }
}

export default function PlayerStatsTable({
  players,
  onPlayerClick,
  className = '',
}: PlayerStatsTableProps): React.ReactElement {
  const [sortKey, setSortKey] = useState<SortKey>('fantasyPoints');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = useMemo(() => {
    const arr = [...players];
    arr.sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      const cmp = typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [players, sortKey, sortDir]);

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {/* Role + Region columns (no sort) */}
              <th className="px-2 py-2.5 w-8" />
              <th className="px-2 py-2.5 w-8" />
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`
                    px-3 py-2.5 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
                    cursor-pointer select-none transition-colors hover:text-[var(--text-primary)]
                    ${col.align === 'left' ? 'text-left' : 'text-right'}
                    ${sortKey === col.key ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                        {sortDir === 'asc' ? <path d="M4 1L7 6H1L4 1Z" /> : <path d="M4 7L1 2H7L4 7Z" />}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const kd = player.avgStats.deaths > 0
                ? (player.avgStats.kills / player.avgStats.deaths).toFixed(2)
                : player.avgStats.kills.toFixed(2);

              return (
                <tr
                  key={player.id}
                  onClick={() => onPlayerClick?.(player.id)}
                  className={`
                    border-b border-[var(--border-subtle)] transition-colors duration-150
                    ${onPlayerClick ? 'cursor-pointer hover:bg-[var(--bg-tertiary)]' : ''}
                    animate-fade-in-up
                  `}
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <td className="px-2 py-2">
                    <RoleIcon role={player.role as PlayerRole} size="sm" />
                  </td>
                  <td className="px-2 py-2">
                    <RegionFlag region={player.region as Region} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)]">
                      {player.name}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-left">
                    <span className="text-xs text-[var(--text-secondary)]">{player.team}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--text-secondary)]">{player.gamesPlayed}</td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-[var(--accent-red)]">{player.avgStats.kills.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--text-secondary)]">{player.avgStats.deaths.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-xs font-bold text-[var(--text-primary)]">{kd}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--accent-teal)]">{player.avgStats.assists.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--status-success)]">{player.avgStats.firstKills.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--status-error)]">{player.avgStats.firstDeaths.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--text-primary)]">{player.avgStats.adr.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                      {player.fantasyPoints.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
