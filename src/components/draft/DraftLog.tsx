'use client';

import React, { useEffect, useRef } from 'react';
import Badge from '@/src/components/ui/Badge';
import type { DraftPick } from '@/src/lib/mock-data';

interface DraftLogProps {
  picks: DraftPick[];
  className?: string;
}

export default function DraftLog({
  picks,
  className = '',
}: DraftLogProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [picks.length]);

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular flex flex-col ${className}`}>
      <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
        <h3 className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Draft Log
        </h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {picks.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            Waiting for first pick...
          </p>
        ) : (
          picks.map((pick) => (
            <div
              key={pick.id}
              className="flex items-center gap-2 py-1.5 text-xs animate-fade-in"
            >
              <span className="text-[var(--text-muted)] shrink-0 w-12 text-right tabular-nums">
                R{pick.round}P{pick.pickNumber}
              </span>
              <span className="text-[var(--accent-teal)] font-semibold shrink-0">
                {pick.userName}
              </span>
              <span className="text-[var(--text-muted)]">selected</span>
              <span className="text-[var(--text-primary)] font-bold font-[family-name:var(--font-display)] uppercase">
                {pick.playerName}
              </span>
              <span className="text-[var(--text-muted)]">({pick.playerTeam})</span>
              {pick.isCaptain && (
                <Badge variant="gold" size="sm">CPT</Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
