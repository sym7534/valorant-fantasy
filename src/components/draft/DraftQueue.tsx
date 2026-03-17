'use client';

import React, { useState } from 'react';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import type { Player } from '@/src/lib/mock-data';
import type { PlayerRole, Region } from '@/src/lib/game-config';

interface QueueItem {
  id: string;
  player: Player;
  rank: number;
}

interface DraftQueueProps {
  queue: QueueItem[];
  onRemove: (playerId: string) => void;
  autoDraft: boolean;
  onToggleAutoDraft: () => void;
  className?: string;
}

export default function DraftQueue({
  queue,
  onRemove,
  autoDraft,
  onToggleAutoDraft,
  className = '',
}: DraftQueueProps): React.ReactElement {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Priority Queue
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {queue.length} player{queue.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Auto-draft toggle */}
        <button
          onClick={onToggleAutoDraft}
          className={`
            flex items-center gap-2 px-3 py-1.5 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
            rounded-sm transition-all duration-150
            ${autoDraft
              ? 'bg-[var(--accent-teal)] text-[var(--text-on-accent)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }
          `}
        >
          <div className={`w-3 h-3 rounded-full ${autoDraft ? 'bg-white' : 'bg-[var(--text-muted)]'}`} />
          Auto-Draft
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No players in queue. Add players from the pool to auto-pick in order.
          </div>
        ) : (
          <div className="space-y-0">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
              >
                {/* Rank */}
                <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--text-muted)] w-6 text-center">
                  {item.rank}
                </span>

                {/* Player info */}
                <RoleIcon role={item.player.role as PlayerRole} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)] truncate block">
                    {item.player.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.player.team}</span>
                </div>

                <RegionFlag region={item.player.region as Region} size="sm" />

                {/* Remove button */}
                <button
                  onClick={() => onRemove(item.player.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors duration-150"
                  aria-label={`Remove ${item.player.name} from queue`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
