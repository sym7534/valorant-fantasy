'use client';

import React from 'react';
import PlayerList from '@/src/components/player/PlayerList';
import type { Player } from '@/src/lib/mock-data';

interface PlayerPoolProps {
  players: Player[];
  draftedPlayerIds: string[];
  isMyTurn: boolean;
  onDraftPlayer: (playerId: string) => void;
  className?: string;
}

export default function PlayerPool({
  players,
  draftedPlayerIds,
  isMyTurn,
  onDraftPlayer,
  className = '',
}: PlayerPoolProps): React.ReactElement {
  return (
    <div className={`flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular ${className}`}>
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
          Player Pool
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {players.length - draftedPlayerIds.length} available
        </p>
      </div>
      <PlayerList
        players={players}
        draftedPlayerIds={draftedPlayerIds}
        onPlayerAction={isMyTurn ? onDraftPlayer : undefined}
        actionLabel={isMyTurn ? 'Draft' : undefined}
        showFilters={true}
        maxHeight="calc(100vh - 300px)"
      />
    </div>
  );
}
