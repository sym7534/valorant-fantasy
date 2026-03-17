'use client';

import React from 'react';
import Badge from '@/src/components/ui/Badge';
import RoleIcon from '@/src/components/player/RoleIcon';
// TEMPORARY types
import type { DraftPick, LeagueMember } from '@/src/lib/mock-data';

interface DraftBoardProps {
  picks: DraftPick[];
  members: LeagueMember[];
  draftOrder: string[];
  totalRounds: number;
  currentRound: number;
  currentPickIndex: number;
  currentUserId: string;
  className?: string;
}

export default function DraftBoard({
  picks,
  members,
  draftOrder,
  totalRounds,
  currentRound,
  currentPickIndex,
  currentUserId,
  className = '',
}: DraftBoardProps): React.ReactElement {
  const memberMap = new Map(members.map((m) => [m.userId, m]));

  function getPickForCell(round: number, memberIndex: number): DraftPick | undefined {
    // Snake draft: odd rounds go forward, even rounds go reverse
    const userId = round % 2 === 1 ? draftOrder[memberIndex] : draftOrder[draftOrder.length - 1 - memberIndex];
    return picks.find((p) => p.round === round && p.userId === userId);
  }

  function isCurrent(round: number, memberIndex: number): boolean {
    if (round !== currentRound) return false;
    const userId = round % 2 === 1 ? draftOrder[memberIndex] : draftOrder[draftOrder.length - 1 - memberIndex];
    const currentDrafter = currentRound % 2 === 1
      ? draftOrder[currentPickIndex]
      : draftOrder[draftOrder.length - 1 - currentPickIndex];
    return userId === currentDrafter;
  }

  return (
    <div className={`overflow-auto ${className}`}>
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-muted)] w-16">
              RND
            </th>
            {draftOrder.map((userId, i) => {
              const member = memberMap.get(userId);
              const isUser = userId === currentUserId;
              return (
                <th
                  key={userId}
                  className={`px-2 py-2 text-center text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
                    ${isUser ? 'text-[var(--accent-red)] bg-[rgba(255,70,85,0.05)]' : 'text-[var(--text-secondary)]'}`}
                >
                  {member?.name ?? `P${i + 1}`}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: totalRounds }, (_, rIdx) => {
            const round = rIdx + 1;
            return (
              <tr key={round} className="border-t border-[var(--border-subtle)]">
                <td className="px-2 py-1 text-xs font-bold font-[family-name:var(--font-display)] text-[var(--text-muted)]">
                  {round}
                  {round === 1 && (
                    <Badge variant="gold" size="sm" className="ml-1">C</Badge>
                  )}
                </td>
                {draftOrder.map((_, memberIdx) => {
                  const pick = getPickForCell(round, memberIdx);
                  const current = isCurrent(round, memberIdx);
                  const userId = round % 2 === 1 ? draftOrder[memberIdx] : draftOrder[draftOrder.length - 1 - memberIdx];
                  const isUser = userId === currentUserId;

                  return (
                    <td
                      key={memberIdx}
                      className={`
                        px-1 py-1 text-center relative
                        ${isUser ? 'bg-[rgba(255,70,85,0.03)]' : ''}
                        ${current ? 'animate-pulse-red' : ''}
                      `}
                    >
                      {pick ? (
                        <div
                          className={`
                            px-2 py-1.5 bg-[var(--bg-tertiary)] clip-angular-sm text-left
                            ${pick.isCaptain ? 'border border-[rgba(245,197,66,0.3)]' : ''}
                          `}
                        >
                          <div className="flex items-center gap-1">
                            <RoleIcon role={pick.playerRole} size="sm" />
                            <span className="text-xs font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)] truncate">
                              {pick.playerName}
                            </span>
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] truncate block">
                            {pick.playerTeam}
                          </span>
                        </div>
                      ) : current ? (
                        <div className="px-2 py-3 border border-dashed border-[var(--accent-red)] clip-angular-sm bg-[rgba(255,70,85,0.05)]">
                          <span className="text-[10px] text-[var(--accent-red)] font-bold uppercase">
                            Picking...
                          </span>
                        </div>
                      ) : (
                        <div className="px-2 py-3 border border-dashed border-[var(--border-subtle)] clip-angular-sm opacity-30">
                          <span className="text-[10px] text-[var(--text-muted)]">---</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
