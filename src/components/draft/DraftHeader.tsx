'use client';

import React from 'react';
import Avatar from '@/src/components/ui/Avatar';
import Badge from '@/src/components/ui/Badge';

interface DraftHeaderProps {
  currentRound: number;
  totalRounds: number;
  currentPickNumber: number;
  totalPicks: number;
  currentDrafterName: string;
  currentDrafterImage?: string;
  secondsRemaining: number;
  totalSeconds: number;
  isMyTurn: boolean;
  isSnakeForward: boolean;
  className?: string;
}

export default function DraftHeader({
  currentRound,
  totalRounds,
  currentPickNumber,
  totalPicks,
  currentDrafterName,
  currentDrafterImage,
  secondsRemaining,
  totalSeconds,
  isMyTurn,
  isSnakeForward,
  className = '',
}: DraftHeaderProps): React.ReactElement {
  const isUrgent = secondsRemaining <= 10;
  const percentage = (secondsRemaining / totalSeconds) * 100;

  return (
    <div className={`bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-6 py-3 ${className}`}>
      <div className="flex items-center justify-between gap-6">
        {/* Round info */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Round</p>
            <p className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              {currentRound} <span className="text-sm text-[var(--text-muted)]">/ {totalRounds}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Pick</p>
            <p className="text-xl font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
              {currentPickNumber} <span className="text-sm text-[var(--text-muted)]">/ {totalPicks}</span>
            </p>
          </div>

          {/* Snake direction arrow */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Direction</span>
            <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-teal)]">
              {isSnakeForward ? '\u2192' : '\u2190'}
            </span>
          </div>

          {currentRound === 1 && (
            <Badge variant="gold" glow size="md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
              Captain Round
            </Badge>
          )}
        </div>

        {/* Current drafter */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Now Picking</p>
            <p className={`text-sm font-bold font-[family-name:var(--font-display)] uppercase ${isMyTurn ? 'text-[var(--accent-teal)]' : 'text-[var(--text-primary)]'}`}>
              {isMyTurn ? 'Your Turn!' : currentDrafterName}
            </p>
          </div>
          <Avatar
            src={currentDrafterImage}
            name={currentDrafterName}
            size="md"
          />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          <div className="w-32">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-1">
              <div
                className={`h-full transition-all duration-1000 linear rounded-full ${
                  isUrgent ? 'bg-[var(--accent-red)]' : 'bg-[var(--accent-teal)]'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <span
            className={`
              text-3xl font-bold font-[family-name:var(--font-display)] tabular-nums
              ${isUrgent ? 'text-[var(--accent-red)] animate-countdown-urgency' : 'text-[var(--text-primary)]'}
            `}
          >
            {secondsRemaining}s
          </span>
        </div>
      </div>
    </div>
  );
}
