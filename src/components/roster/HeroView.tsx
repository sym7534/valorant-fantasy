'use client';

import React from 'react';
import LineupSlot from './LineupSlot';
import type { RosterPlayer } from '@/src/lib/mock-data';

interface HeroViewProps {
  activePlayers: RosterPlayer[];
  weeklyTotalPoints: number;
  lineupLockTime?: string;
  onSwapPlayer?: (rosterPlayerId: string) => void;
  className?: string;
}

export default function HeroView({
  activePlayers,
  weeklyTotalPoints,
  lineupLockTime,
  onSwapPlayer,
  className = '',
}: HeroViewProps): React.ReactElement {
  return (
    <div className={`relative ${className}`}>
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-atmospheric pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Radial glow behind the cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-radial-glow pointer-events-none" />

      {/* Top bar with weekly score and lock timer */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            Active Lineup
          </h2>
          {lineupLockTime && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Lineup locks: <span className="text-[var(--status-warning)] font-semibold">{lineupLockTime}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Weekly Points</p>
          <p className="text-4xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
            {weeklyTotalPoints.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Hero card row */}
      <div className="relative z-10 flex items-end justify-center gap-4 px-4 pb-8 pt-4">
        {Array.from({ length: 5 }, (_, i) => {
          const rosterPlayer = activePlayers[i];
          return (
            <div
              key={rosterPlayer?.id ?? `empty-${i}`}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <LineupSlot
                rosterPlayer={rosterPlayer}
                index={i}
                onSwap={
                  rosterPlayer && !rosterPlayer.isCaptain && onSwapPlayer
                    ? () => onSwapPlayer(rosterPlayer.id)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {/* Bottom decorative line */}
      <div className="relative z-10 mx-8">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent-red)] to-transparent opacity-40" />
      </div>
    </div>
  );
}
