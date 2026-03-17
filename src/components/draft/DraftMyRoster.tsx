'use client';

import React from 'react';
import Badge from '@/src/components/ui/Badge';
import RoleIcon from '@/src/components/player/RoleIcon';
import RegionFlag from '@/src/components/player/RegionFlag';
import type { DraftPick } from '@/src/lib/mock-data';
import { REGIONS, PLAYER_ROLES, ROLE_SLOTS_BY_ROSTER_SIZE } from '@/src/lib/game-config';
import type { Region, PlayerRole } from '@/src/lib/game-config';

interface DraftMyRosterProps {
  picks: DraftPick[];
  userId: string;
  rosterSize: number;
  className?: string;
}

export default function DraftMyRoster({
  picks,
  userId,
  rosterSize,
  className = '',
}: DraftMyRosterProps): React.ReactElement {
  const myPicks = picks.filter((p) => p.userId === userId);
  const roleSlots = ROLE_SLOTS_BY_ROSTER_SIZE[rosterSize] ?? ROLE_SLOTS_BY_ROSTER_SIZE[10];

  // Count picks by role
  const roleCounts: Record<string, number> = {};
  for (const role of PLAYER_ROLES) {
    roleCounts[role] = myPicks.filter((p) => p.playerRole === role).length;
  }

  // Count picks by region
  const regionCounts: Record<string, number> = {};
  for (const region of REGIONS) {
    regionCounts[region] = myPicks.filter((p) => p.playerRegion === region).length;
  }

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
          My Roster
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          {myPicks.length} / {rosterSize} picks
        </p>
      </div>

      {/* Roles */}
      <div className="px-4 py-3 space-y-3 flex-1 overflow-y-auto">
        {PLAYER_ROLES.map((role) => {
          const slotCount = roleSlots[role as PlayerRole] ?? 0;
          if (slotCount === 0) return null;
          const picksForRole = myPicks.filter((p) => p.playerRole === role);

          return (
            <div key={role}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <RoleIcon role={role as PlayerRole} size="sm" />
                  <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                    {role}
                  </span>
                </div>
                <span className={`text-xs font-bold font-[family-name:var(--font-display)] ${picksForRole.length >= slotCount ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}>
                  {picksForRole.length}/{slotCount}
                </span>
              </div>

              {Array.from({ length: slotCount }, (_, i) => {
                const pick = picksForRole[i];
                return (
                  <div
                    key={`${role}-${i}`}
                    className="flex items-center gap-2 px-3 py-2 mb-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] clip-angular-sm"
                  >
                    {pick ? (
                      <>
                        <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)] truncate flex-1">
                          {pick.playerName}
                        </span>
                        <RegionFlag region={pick.playerRegion as Region} size="sm" />
                        {pick.isCaptain && (
                          <Badge variant="gold" size="sm">CPT</Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Wildcard slots */}
        {(roleSlots.Wildcard ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
                Wildcard
              </span>
              <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--text-muted)]">
                {Math.max(0, myPicks.length - (rosterSize - (roleSlots.Wildcard ?? 0)))}/{roleSlots.Wildcard}
              </span>
            </div>
            {Array.from({ length: roleSlots.Wildcard ?? 0 }, (_, i) => (
              <div
                key={`wildcard-${i}`}
                className="flex items-center gap-2 px-3 py-2 mb-1 bg-[var(--bg-primary)] border border-dashed border-[var(--border-subtle)] clip-angular-sm"
              >
                <span className="text-xs text-[var(--text-muted)] italic">Any Role</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Region checklist */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Region Requirements (min 2 each)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {REGIONS.map((region) => {
            const count = regionCounts[region] ?? 0;
            const satisfied = count >= 2;
            return (
              <div key={region} className="flex items-center gap-2">
                <RegionFlag region={region} size="sm" />
                <span className={`text-xs font-medium ${satisfied ? 'text-[var(--status-success)]' : 'text-[var(--text-muted)]'}`}>
                  {count}/2
                </span>
                {satisfied && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--status-success)">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
