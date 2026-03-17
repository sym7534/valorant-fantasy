'use client';

import React from 'react';

interface DraftTimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  isMyTurn: boolean;
  className?: string;
}

export default function DraftTimer({
  secondsRemaining,
  totalSeconds,
  isMyTurn,
  className = '',
}: DraftTimerProps): React.ReactElement {
  const percentage = (secondsRemaining / totalSeconds) * 100;
  const isUrgent = secondsRemaining <= 10;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative w-28 h-28">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={isUrgent ? 'var(--accent-red)' : isMyTurn ? 'var(--accent-teal)' : 'var(--text-muted)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - percentage / 100)}`}
            className="transition-all duration-1000 linear"
          />
        </svg>

        {/* Timer number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`
              text-4xl font-bold font-[family-name:var(--font-display)]
              ${isUrgent ? 'text-[var(--accent-red)] animate-countdown-urgency' : 'text-[var(--text-primary)]'}
            `}
          >
            {secondsRemaining}
          </span>
        </div>
      </div>

      {isMyTurn && (
        <span
          className={`text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
            ${isUrgent ? 'text-[var(--accent-red)]' : 'text-[var(--accent-teal)]'}`}
        >
          Your Pick!
        </span>
      )}
    </div>
  );
}
