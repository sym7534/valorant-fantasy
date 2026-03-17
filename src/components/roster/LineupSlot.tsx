'use client';

import React from 'react';
import PlayerCard from '@/src/components/player/PlayerCard';
import type { RosterPlayer } from '@/src/lib/mock-data';

interface LineupSlotProps {
  rosterPlayer?: RosterPlayer;
  index: number;
  onSwap?: () => void;
  className?: string;
}

export default function LineupSlot({
  rosterPlayer,
  index,
  onSwap,
  className = '',
}: LineupSlotProps): React.ReactElement {
  // Stagger offset for depth feel
  const offset = index === 0 ? 'mt-4' : index === 1 ? 'mt-0' : index === 2 ? '-mt-2' : index === 3 ? 'mt-0' : 'mt-4';

  if (!rosterPlayer) {
    return (
      <div className={`w-[200px] h-[350px] border-2 border-dashed border-[var(--border-subtle)] clip-angular-lg flex items-center justify-center ${offset} ${className}`}>
        <span className="text-sm text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase">
          Empty Slot
        </span>
      </div>
    );
  }

  const stats = {
    kills: Math.floor(Math.random() * 20) + 8,
    deaths: Math.floor(Math.random() * 15) + 5,
    assists: Math.floor(Math.random() * 10) + 2,
    firstKills: Math.floor(Math.random() * 6),
    firstDeaths: Math.floor(Math.random() * 4),
    roundsWon: 0,
    roundsLost: 0,
    adr: Math.floor(Math.random() * 60) + 120,
  };

  const designation = rosterPlayer.isStarPlayer ? 'star' as const : rosterPlayer.isCaptain ? 'captain' as const : 'normal' as const;

  return (
    <div className={`relative group ${offset} ${className}`}>
      <PlayerCard
        player={rosterPlayer.player}
        variant="full"
        designation={designation}
        stats={stats}
        fantasyPoints={rosterPlayer.weeklyPoints}
      />
      {/* Swap overlay on hover - only for non-captain */}
      {!rosterPlayer.isCaptain && onSwap && (
        <button
          onClick={onSwap}
          className="absolute inset-0 bg-[rgba(15,25,35,0.8)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center clip-angular-lg"
        >
          <span className="px-4 py-2 bg-[var(--accent-red)] text-[var(--text-on-accent)] font-bold font-[family-name:var(--font-display)] uppercase tracking-wider clip-angular-sm text-sm">
            Swap Player
          </span>
        </button>
      )}
    </div>
  );
}
