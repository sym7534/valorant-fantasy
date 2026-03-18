'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import { CrownIcon, StarIcon } from '@/src/components/player/PlayerCard';
import type { RosterResponse } from '@/src/lib/api-types';
import type { LeagueStatus } from '@/src/lib/game-config';

interface SidebarProps {
  leagueId: string;
  leagueName: string;
  leagueStatus: LeagueStatus;
  className?: string;
}

export default function Sidebar({
  leagueId,
  leagueName,
  leagueStatus,
  className = '',
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const base = `/league/${leagueId}`;
  const isActive = leagueStatus === 'ACTIVE' || leagueStatus === 'COMPLETED';

  const links = [
    { href: base, label: 'Lobby', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: `${base}/draft`, label: 'Draft Room', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: `${base}/roster`, label: 'My Roster', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  ];

  // Roster data for active season sidebar
  const [roster, setRoster] = useState<RosterResponse | null>(null);

  const loadRoster = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/roster`, { cache: 'no-store' });
      const payload = (await response.json()) as RosterResponse & { error?: string };
      if (response.ok && !payload.error) {
        setRoster(payload);
      }
    } catch {
      // Silently fail
    }
  }, [leagueId]);

  useEffect(() => {
    if (isActive) {
      void loadRoster();
    }
  }, [isActive, loadRoster]);

  const activeLineupSlots = roster?.activeLineup?.slots ?? [];
  const weeklyTotal = roster?.weeklyScore?.totalPoints ?? 0;

  return (
    <aside className={`w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] shrink-0 flex flex-col ${className}`}>
      {/* League name */}
      <div className="px-4 py-5 border-b border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">League</p>
        <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)] truncate mt-0.5">
          {leagueName}
        </h2>
      </div>

      {/* Active season: team summary */}
      {isActive && roster && (
        <div className="flex-1 overflow-y-auto">
          {/* Week + Points header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              Week {roster.currentWeek}
            </p>
            <p className="text-lg font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">
              {weeklyTotal.toFixed(1)} <span className="text-xs text-[var(--text-muted)]">pts</span>
            </p>
          </div>

          {/* Active lineup */}
          <div className="px-3 py-3">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
              Active Lineup
            </p>
            <div className="space-y-1">
              {activeLineupSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-[var(--bg-tertiary)] transition-colors">
                  <RoleIcon role={slot.player.roles[0]} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {slot.player.name}
                    </p>
                    <div className="flex items-center gap-1">
                      <RegionFlag region={slot.player.region} size="sm" />
                      <span className="text-[9px] text-[var(--text-muted)]">{slot.player.team}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {slot.isCaptain && <CrownIcon size={12} />}
                    {slot.isStarPlayer && <StarIcon size={12} />}
                    <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)] min-w-[28px] text-right">
                      {slot.weeklyPoints?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                </div>
              ))}
              {activeLineupSlots.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] px-2">No lineup set</p>
              )}
            </div>
          </div>

          {/* Bench count */}
          {roster && (
            <div className="px-4 py-2 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                Bench: {roster.players.length - activeLineupSlots.length} players
              </p>
            </div>
          )}
        </div>
      )}

      {/* Nav links — compact at bottom when active, full when not */}
      <nav className={`py-2 ${isActive ? 'border-t border-[var(--border-subtle)] mt-auto' : ''}`}>
        {links.map((link) => {
          const isCurrent = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 text-sm
                transition-all duration-150
                ${isCurrent
                  ? 'text-[var(--accent-red)] bg-[rgba(255,70,85,0.08)] border-l-2 border-l-[var(--accent-red)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-l-2 border-l-transparent'
                }
              `}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={link.icon} />
              </svg>
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
