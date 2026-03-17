'use client';

import React from 'react';
import Modal from '@/src/components/ui/Modal';
import Badge from '@/src/components/ui/Badge';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import type { Player, PlayerMatchStats } from '@/src/lib/mock-data';
import type { PlayerRole, Region } from '@/src/lib/game-config';

interface WeekPoints {
  weekNumber: number;
  points: number;
}

interface PlayerQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  stats?: PlayerMatchStats;
  recentWeeks?: WeekPoints[];
  onViewFullProfile?: () => void;
}

export default function PlayerQuickView({
  isOpen,
  onClose,
  player,
  stats,
  recentWeeks = [],
  onViewFullProfile,
}: PlayerQuickViewProps): React.ReactElement | null {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Player Details">
      <div className="space-y-4">
        {/* Player header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[var(--bg-tertiary)] clip-angular flex items-center justify-center">
            <RoleIcon role={player.role as PlayerRole} size="md" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)]">
              {player.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[var(--text-secondary)]">{player.team}</span>
              <RegionFlag region={player.region as Region} size="sm" />
              <Badge variant="default" size="sm">{player.role}</Badge>
            </div>
          </div>
        </div>

        {/* Key stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'K', value: stats.kills, color: 'text-[var(--accent-red)]' },
              { label: 'D', value: stats.deaths, color: 'text-[var(--text-secondary)]' },
              { label: 'A', value: stats.assists, color: 'text-[var(--accent-teal)]' },
              { label: 'ADR', value: stats.adr.toFixed(0), color: 'text-[var(--text-primary)]' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm p-3 text-center">
                <p className={`text-lg font-bold font-[family-name:var(--font-display)] ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[9px] text-[var(--text-muted)] uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent weeks */}
        {recentWeeks.length > 0 && (
          <div>
            <p className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Recent Weeks
            </p>
            <div className="flex items-center gap-2">
              {recentWeeks.map((week) => (
                <div key={week.weekNumber} className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm p-2 text-center">
                  <p className="text-[10px] text-[var(--text-muted)]">W{week.weekNumber}</p>
                  <p className="text-sm font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
                    {week.points.toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View full profile link */}
        {onViewFullProfile && (
          <button
            onClick={onViewFullProfile}
            className="w-full text-center text-sm font-medium text-[var(--accent-teal)] hover:text-[var(--accent-teal-hover)] transition-colors duration-150 py-2"
          >
            View Full Profile &rarr;
          </button>
        )}
      </div>
    </Modal>
  );
}
