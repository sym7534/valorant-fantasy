import React from 'react';
import Badge from '@/src/components/ui/Badge';
import type { LeagueMember } from '@/src/lib/mock-data';

interface MemberListProps {
  members: LeagueMember[];
  currentUserId: string;
  className?: string;
}

export default function MemberList({
  members,
  currentUserId,
  className = '',
}: MemberListProps): React.ReactElement {
  return (
    <div className={`space-y-1 ${className}`}>
      {members.map((member, i) => {
        const isUser = member.userId === currentUserId;
        return (
          <div
            key={member.id}
            className={`
              flex items-center gap-3 px-4 py-3
              ${isUser ? 'bg-[rgba(255,70,85,0.05)] border-l-2 border-l-[var(--accent-red)]' : 'hover:bg-[var(--bg-tertiary)]'}
              transition-colors duration-150
              animate-fade-in-up
            `}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                {member.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {member.name}
                </span>
                {member.isCreator && (
                  <Badge variant="gold" size="sm">Host</Badge>
                )}
                {isUser && (
                  <Badge variant="red" size="sm">You</Badge>
                )}
              </div>
            </div>

            <div className="shrink-0">
              {member.isReady ? (
                <Badge variant="success" size="sm">Ready</Badge>
              ) : (
                <Badge variant="muted" size="sm">Waiting</Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
