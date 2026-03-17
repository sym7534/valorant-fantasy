'use client';

import React, { useState } from 'react';
import Badge from '@/src/components/ui/Badge';
import PlayerCard from '@/src/components/player/PlayerCard';
import type { StandingsEntry } from '@/src/lib/mock-data';
import { MOCK_ROSTER_PLAYERS } from '@/src/lib/mock-data';

interface StandingsTableProps {
  standings: StandingsEntry[];
  currentUserId: string;
  className?: string;
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'same' }): React.ReactElement {
  if (trend === 'up') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--status-success)">
        <path d="M6 2L10 8H2L6 2Z" />
      </svg>
    );
  }
  if (trend === 'down') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--status-error)">
        <path d="M6 10L2 4H10L6 10Z" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--text-muted)">
      <rect x="2" y="5" width="8" height="2" rx="1" />
    </svg>
  );
}

export default function StandingsTable({
  standings,
  currentUserId,
  className = '',
}: StandingsTableProps): React.ReactElement {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular overflow-hidden ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="px-4 py-3 text-left text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)] w-12">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
              Member
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
              Week
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]">
              Total
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)] w-12">
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((entry, i) => {
            const isUser = entry.userId === currentUserId;
            const isExpanded = expandedUserId === entry.userId;

            return (
              <React.Fragment key={entry.userId}>
                <tr
                  className={`
                    border-b border-[var(--border-subtle)] cursor-pointer transition-colors duration-150
                    ${isUser ? 'bg-[rgba(255,70,85,0.05)]' : 'hover:bg-[var(--bg-tertiary)]'}
                    animate-fade-in-up
                  `}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
                >
                  <td className="px-4 py-3">
                    <span className={`text-lg font-bold font-[family-name:var(--font-display)] ${entry.rank <= 3 ? 'text-[var(--accent-gold)]' : 'text-[var(--text-secondary)]'}`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                          {entry.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {entry.userName}
                      </span>
                      {isUser && <Badge variant="red" size="sm">You</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--text-primary)]">
                      {entry.weeklyPoints.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                      {entry.totalPoints.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-center">
                    <TrendArrow trend={entry.trend} />
                  </td>
                </tr>

                {/* Expanded roster view */}
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-[var(--bg-primary)]">
                      <div className="space-y-0 animate-fade-in-down">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">
                          Active Lineup
                        </p>
                        {/* Use mock roster for expansion preview */}
                        {MOCK_ROSTER_PLAYERS.filter((rp) => rp.isActive).map((rp) => (
                          <PlayerCard
                            key={rp.id}
                            player={rp.player}
                            variant="compact"
                            designation={rp.isCaptain ? 'captain' : rp.isStarPlayer ? 'star' : 'normal'}
                            fantasyPoints={rp.weeklyPoints}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
