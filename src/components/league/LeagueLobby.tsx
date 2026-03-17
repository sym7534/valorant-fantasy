'use client';

import React, { useState } from 'react';
import Button from '@/src/components/ui/Button';
import Badge from '@/src/components/ui/Badge';
import Avatar from '@/src/components/ui/Avatar';
import Card from '@/src/components/ui/Card';
import InviteCode from '@/src/components/league/InviteCode';
import Timer from '@/src/components/ui/Timer';
import type { LeagueMember } from '@/src/lib/mock-data';
import { MIN_LEAGUE_SIZE, MAX_LEAGUE_SIZE } from '@/src/lib/game-config';

interface LeagueLobbyProps {
  leagueId: string;
  leagueName: string;
  inviteCode: string;
  status: string;
  members: LeagueMember[];
  maxMembers: number;
  draftOrder: string[];
  draftStartTime?: Date;
  currentUserId: string;
  creatorId: string;
  onStartDraft?: () => void;
  onRandomizeOrder?: () => void;
  className?: string;
}

export default function LeagueLobby({
  leagueId,
  leagueName,
  inviteCode,
  status,
  members,
  maxMembers,
  draftOrder,
  draftStartTime,
  currentUserId,
  creatorId,
  onStartDraft,
  onRandomizeOrder,
  className = '',
}: LeagueLobbyProps): React.ReactElement {
  const isCreator = currentUserId === creatorId;
  const canStartDraft = isCreator && members.length >= MIN_LEAGUE_SIZE && status === 'SETUP';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)]">
            {leagueName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {members.length} / {maxMembers} members
          </p>
        </div>
        <InviteCode code={inviteCode} />
      </div>

      {/* Draft countdown */}
      {draftStartTime && status === 'SETUP' && (
        <Card className="p-6 text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Draft Starts In</p>
          <Timer deadline={draftStartTime} />
        </Card>
      )}

      {/* Members grid */}
      <div>
        <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
          Members
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {members.map((member, i) => {
            const isUser = member.userId === currentUserId;
            return (
              <Card
                key={member.id}
                className={`p-4 animate-fade-in-up ${isUser ? 'border-[var(--accent-red)]' : ''}`}
                hover={false}
              >
                <div className="flex flex-col items-center gap-2">
                  <Avatar name={member.name} src={member.image} size="lg" />
                  <span className="text-sm font-bold font-[family-name:var(--font-display)] uppercase text-[var(--text-primary)] truncate max-w-full">
                    {member.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {member.isCreator && <Badge variant="gold" size="sm">Host</Badge>}
                    {isUser && <Badge variant="red" size="sm">You</Badge>}
                    {member.isReady ? (
                      <Badge variant="success" size="sm">Ready</Badge>
                    ) : (
                      <Badge variant="muted" size="sm">Waiting</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: maxMembers - members.length }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="border-2 border-dashed border-[var(--border-subtle)] clip-angular p-4 flex flex-col items-center justify-center min-h-[140px] opacity-40"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2M18 8l4 4-4 4M12 7a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs text-[var(--text-muted)] mt-2">Open Slot</span>
            </div>
          ))}
        </div>
      </div>

      {/* Draft order */}
      {draftOrder.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Draft Order
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {draftOrder.map((userId, idx) => {
              const member = members.find((m) => m.userId === userId);
              return (
                <div key={userId} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-[var(--text-muted)]">&rarr;</span>}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-sm">
                    <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--accent-gold)]">{idx + 1}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{member?.name ?? 'Unknown'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Admin controls */}
      {isCreator && status === 'SETUP' && (
        <div className="flex items-center gap-3">
          {onRandomizeOrder && (
            <Button variant="secondary" size="md" onClick={onRandomizeOrder}>
              Randomize Order
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={onStartDraft}
            disabled={!canStartDraft}
          >
            {members.length < MIN_LEAGUE_SIZE
              ? `Need ${MIN_LEAGUE_SIZE - members.length} more member${MIN_LEAGUE_SIZE - members.length > 1 ? 's' : ''}`
              : 'Start Draft'
            }
          </Button>
        </div>
      )}

      {/* Waiting message for non-creators */}
      {!isCreator && status === 'SETUP' && (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-secondary)]">
            Waiting for the host to start the draft...
          </p>
        </div>
      )}
    </div>
  );
}
