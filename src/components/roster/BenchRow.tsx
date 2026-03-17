'use client';

import React from 'react';
import PlayerCard from '@/src/components/player/PlayerCard';
import type { RosterPlayer } from '@/src/lib/mock-data';

interface BenchRowProps {
  benchPlayers: RosterPlayer[];
  onSwapIn?: (rosterPlayerId: string) => void;
  onSetStar?: (rosterPlayerId: string) => void;
  className?: string;
}

export default function BenchRow({
  benchPlayers,
  onSwapIn,
  onSetStar,
  className = '',
}: BenchRowProps): React.ReactElement {
  void onSetStar;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Bench
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {benchPlayers.length} player{benchPlayers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-0">
        {benchPlayers.map((rp) => (
          <div key={rp.id} className="opacity-75 hover:opacity-100 transition-opacity">
            <PlayerCard
              player={rp.player}
              variant="compact"
              designation={rp.isCaptain ? 'captain' : 'normal'}
              starCooldownWeeksLeft={rp.starCooldownWeeksLeft}
              actionLabel={onSwapIn ? 'Swap In' : undefined}
              onAction={onSwapIn ? () => onSwapIn(rp.id) : undefined}
            />
          </div>
        ))}
        {benchPlayers.length === 0 && (
          <div className="px-4 py-6 text-center text-[var(--text-muted)] text-sm">
            No players on bench
          </div>
        )}
      </div>
    </div>
  );
}
