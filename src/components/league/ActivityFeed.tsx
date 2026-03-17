'use client';

import React from 'react';

type ActivityType = 'draft_pick' | 'trade' | 'lineup_change' | 'star_player' | 'join' | 'score';

interface ActivityItem {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const typeIcons: Record<ActivityType, { path: string; color: string }> = {
  draft_pick: {
    path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: 'var(--accent-teal)',
  },
  trade: {
    path: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
    color: 'var(--accent-gold)',
  },
  lineup_change: {
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'var(--accent-red)',
  },
  star_player: {
    path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    color: 'var(--accent-gold)',
  },
  join: {
    path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
    color: 'var(--status-success)',
  },
  score: {
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    color: 'var(--accent-teal)',
  },
};

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
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

      <div className="max-h-[400px] overflow-y-auto">
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
