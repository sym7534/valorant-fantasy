'use client';

import React from 'react';
import Badge from '@/src/components/ui/Badge';
import type { WeeklyScore } from '@/src/lib/mock-data';

interface WeeklyScoreBreakdownProps {
  weeklyScore: WeeklyScore;
  className?: string;
}

export default function WeeklyScoreBreakdown({
  weeklyScore,
  className = '',
}: WeeklyScoreBreakdownProps): React.ReactElement {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
          Week {weeklyScore.weekNumber} Breakdown
        </h3>
        <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
          {weeklyScore.totalPoints.toFixed(1)} pts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {['Player', 'Base', 'Multiplier', 'Final'].map((header) => (
                <th
                  key={header}
                  className={`
                    px-4 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)]
                    ${header === 'Player' ? 'text-left' : 'text-right'}
                  `}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklyScore.playerScores.map((ps) => (
              <tr key={ps.playerId} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)]">
                      {ps.playerName}
                    </span>
                    {ps.designation === 'captain' && (
                      <Badge variant="gold" size="sm">CPT</Badge>
                    )}
                    {ps.designation === 'star' && (
                      <Badge variant="gold" size="sm" glow>STAR</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-sm font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                    {ps.baseScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-sm font-bold font-[family-name:var(--font-display)] ${
                    ps.multiplier > 1 ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)]'
                  }`}>
                    {ps.multiplier}x
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                    {ps.finalScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr className="bg-[var(--bg-primary)]">
              <td className="px-4 py-3">
                <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)]">
                  Total
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                  {weeklyScore.playerScores.reduce((sum, ps) => sum + ps.baseScore, 0).toFixed(1)}
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                  {weeklyScore.totalPoints.toFixed(1)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
