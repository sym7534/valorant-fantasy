import React from 'react';
import Card from '@/src/components/ui/Card';
import Badge from '@/src/components/ui/Badge';
import type { League } from '@/src/lib/mock-data';

interface LeagueCardProps {
  league: League;
  userRank?: number;
  onClick?: () => void;
  className?: string;
}

const statusVariant: Record<string, 'teal' | 'warning' | 'success' | 'muted'> = {
  SETUP: 'teal',
  DRAFTING: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'muted',
};

const statusLabel: Record<string, string> = {
  SETUP: 'Setting Up',
  DRAFTING: 'Drafting',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

export default function LeagueCard({
  league,
  userRank,
  onClick,
  className = '',
}: LeagueCardProps): React.ReactElement {
  return (
    <Card hover onClick={onClick} className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)] truncate">
              {league.name}
            </h3>
            <Badge variant={statusVariant[league.status]} size="sm">
              {statusLabel[league.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)] font-semibold">{league.memberCount}</span>
              /{league.maxMembers} members
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Roster: <span className="text-[var(--text-primary)] font-semibold">{league.rosterSize}</span>
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Timer: <span className="text-[var(--text-primary)] font-semibold">{league.draftPickTime}s</span>
            </span>
          </div>
        </div>

        {userRank !== undefined && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Rank</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
              #{userRank}
            </p>
          </div>
        )}
      </div>

      {/* Subtle bottom accent */}
      <div className="mt-4 h-0.5 bg-gradient-to-r from-[var(--accent-red)] via-transparent to-transparent opacity-30" />
    </Card>
  );
}
