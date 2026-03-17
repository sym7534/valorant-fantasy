'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Select from '@/src/components/ui/Select';
import Badge from '@/src/components/ui/Badge';
import type { Player, PlayerMatchStats } from '@/src/lib/mock-data';

interface ComparePlayer extends Player {
  avgStats: PlayerMatchStats;
  fantasyPoints: number;
}

interface PlayerCompareProps {
  availablePlayers: ComparePlayer[];
  className?: string;
}

const COLORS = ['#ff4655', '#2dd4bf', '#f5c542', '#818cf8'];

const STAT_LABELS: { key: keyof PlayerMatchStats | 'fantasyPoints'; label: string }[] = [
  { key: 'kills', label: 'Kills' },
  { key: 'deaths', label: 'Deaths' },
  { key: 'assists', label: 'Assists' },
  { key: 'firstKills', label: 'First Kills' },
  { key: 'firstDeaths', label: 'First Deaths' },
  { key: 'adr', label: 'ADR' },
  { key: 'fantasyPoints', label: 'Fantasy Pts' },
];

export default function PlayerCompare({
  availablePlayers,
  className = '',
}: PlayerCompareProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedPlayers = selectedIds
    .map((id) => availablePlayers.find((p) => p.id === id))
    .filter((p): p is ComparePlayer => p !== undefined);

  function handleAddPlayer(value: string): void {
    if (value && selectedIds.length < 4 && !selectedIds.includes(value)) {
      setSelectedIds([...selectedIds, value]);
    }
  }

  function handleRemovePlayer(id: string): void {
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
  }

  const playerOptions = availablePlayers
    .filter((p) => !selectedIds.includes(p.id))
    .map((p) => ({ label: `${p.name} (${p.team})`, value: p.id }));

  // Build chart data
  const chartData = STAT_LABELS.map((stat) => {
    const entry: Record<string, unknown> = { stat: stat.label };
    for (const player of selectedPlayers) {
      const val = stat.key === 'fantasyPoints'
        ? player.fantasyPoints
        : player.avgStats[stat.key];
      entry[player.name] = typeof val === 'number' ? Math.round(val * 10) / 10 : 0;
    }
    return entry;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Player selector */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-64">
          <Select
            label={`Add Player (${selectedIds.length}/4)`}
            options={playerOptions}
            value=""
            onChange={handleAddPlayer}
            placeholder="Select a player..."
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedPlayers.map((player, i) => (
            <div
              key={player.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-sm"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)]">
                {player.name}
              </span>
              <button
                onClick={() => handleRemovePlayer(player.id)}
                className="text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {selectedPlayers.length >= 2 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid stroke="#1e2d3d" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fill: '#5a6672', fontSize: 11, fontFamily: 'var(--font-display)' }}
                axisLine={{ stroke: '#2a3a4a' }}
              />
              <YAxis
                type="category"
                dataKey="stat"
                width={100}
                tick={{ fill: '#8b978f', fontSize: 11, fontFamily: 'var(--font-display)' }}
                axisLine={{ stroke: '#2a3a4a' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2634',
                  border: '1px solid #2a3a4a',
                  borderRadius: '2px',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#ece8e1', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-display)' }} />
              {selectedPlayers.map((player, i) => (
                <Bar
                  key={player.id}
                  dataKey={player.name}
                  fill={COLORS[i]}
                  radius={[0, 2, 2, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">
          Select at least 2 players to compare stats
        </div>
      )}
    </div>
  );
}
