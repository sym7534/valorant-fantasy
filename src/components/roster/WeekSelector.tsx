'use client';

import React from 'react';
import Badge from '@/src/components/ui/Badge';

interface Week {
  weekNumber: number;
  score?: number;
  isLive?: boolean;
}

interface WeekSelectorProps {
  weeks: Week[];
  currentWeek: number;
  selectedWeek: number;
  onSelectWeek: (weekNumber: number) => void;
  className?: string;
}

export default function WeekSelector({
  weeks,
  currentWeek,
  selectedWeek,
  onSelectWeek,
  className = '',
}: WeekSelectorProps): React.ReactElement {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${className}`}>
      {weeks.map((week) => {
        const isSelected = week.weekNumber === selectedWeek;
        const isCurrent = week.weekNumber === currentWeek;
        const isPast = week.weekNumber < currentWeek;

        return (
          <button
            key={week.weekNumber}
            onClick={() => onSelectWeek(week.weekNumber)}
            className={`
              relative flex flex-col items-center px-4 py-2 min-w-[72px]
              font-[family-name:var(--font-display)] transition-all duration-150
              border clip-angular-sm shrink-0
              ${isSelected
                ? 'bg-[var(--bg-tertiary)] border-[var(--accent-red)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-secondary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-red)]'
              }
            `}
          >
            <span className="text-[10px] uppercase tracking-wider">Week</span>
            <span className="text-lg font-bold">{week.weekNumber}</span>

            {isCurrent && week.isLive && (
              <Badge variant="error" size="sm" className="absolute -top-2 -right-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block mr-1" />
                Live
              </Badge>
            )}

            {isPast && week.score !== undefined && (
              <span className="text-[10px] text-[var(--accent-gold)] font-bold">
                {week.score.toFixed(0)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
