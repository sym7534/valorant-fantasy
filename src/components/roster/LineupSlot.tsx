'use client';

import React from 'react';
import PlayerCard from '@/src/components/player/PlayerCard';
import type { PlayerMatchStats } from '@/src/lib/game-config';

type LineupPlayer = {
  id: string;
  playerId?: string;
  player: {
    id: string;
    name: string;
    team: string;
    region: 'Americas' | 'Pacific' | 'EMEA' | 'China';
    roles: ('Duelist' | 'Initiator' | 'Controller' | 'Sentinel')[];
    imageUrl?: string | null;
  };
  isCaptain: boolean;
  isStarPlayer: boolean;
  weeklyPoints?: number | null;
};

interface LineupSlotProps {
  rosterPlayer?: LineupPlayer;
  index: number;
  onSwap?: () => void;
  className?: string;
}

function buildStableStats(playerId: string): PlayerMatchStats {
  const seed = Array.from(playerId).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return {
    kills: 10 + (seed % 18),
    deaths: 6 + (seed % 10),
    assists: 3 + (seed % 9),
    firstKills: seed % 5,
    firstDeaths: seed % 4,
    roundsWon: 0,
    roundsLost: 0,
    adr: 120 + (seed % 50),
  };
}

export default function LineupSlot({
  rosterPlayer,
  index,
  onSwap,
  className = '',
}: LineupSlotProps): React.ReactElement {
  const offset =
    index === 0 ? 'mt-4' : index === 1 ? 'mt-0' : index === 2 ? '-mt-2' : index === 3 ? 'mt-0' : 'mt-4';

  if (!rosterPlayer) {
    return (
      <div className={`w-[200px] h-[350px] border-2 border-dashed border-[var(--border-subtle)] clip-angular-lg flex items-center justify-center ${offset} ${className}`}>
        <span className="text-sm text-[var(--text-muted)] font-[family-name:var(--font-display)] uppercase">
          Empty Slot
        </span>
      </div>
    );
  }

  const stats = buildStableStats(rosterPlayer.playerId ?? rosterPlayer.player.id);
  const designation = rosterPlayer.isStarPlayer
    ? 'star'
    : rosterPlayer.isCaptain
      ? 'captain'
      : 'normal';

  return (
    <div className={`relative group ${offset} ${className}`}>
      <PlayerCard
        player={rosterPlayer.player}
        variant="full"
        designation={designation}
        stats={stats}
        fantasyPoints={rosterPlayer.weeklyPoints ?? undefined}
      />
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
