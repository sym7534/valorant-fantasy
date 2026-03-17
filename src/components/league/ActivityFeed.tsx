'use client';

import React from 'react';
import type { LeagueActivityEntry } from '@/src/lib/api-types';

interface ActivityFeedProps {
  activities: LeagueActivityEntry[];
  className?: string;
}

const typeIcons: Record<LeagueActivityEntry['type'], { path: string; color: string }> = {
  league_created: {
    path: 'M12 5v14M5 12h14',
    color: 'var(--accent-red)',
  },
  league_joined: {
    path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3M9 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a6 6 0 0112 0',
    color: 'var(--status-success)',
  },
  draft_started: {
    path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5h6',
    color: 'var(--accent-teal)',
  },
  draft_completed: {
    path: 'M5 13l4 4L19 7',
    color: 'var(--status-success)',
  },
  week_scored: {
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m6 0V5a2 2 0 012-2h2a2 2 0 012 2v14',
    color: 'var(--accent-gold)',
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

export default function ActivityFeed({
  activities,
  className = '',
}: ActivityFeedProps): React.ReactElement {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-default)] clip-angular ${className}`}>
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)]">
          Activity
        </h3>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
            No activity yet
          </div>
        ) : (
          activities.map((activity) => {
            const icon = typeIcons[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
              >
                <div className="shrink-0 mt-0.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={icon.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={icon.path} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
