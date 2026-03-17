'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  leagueId: string;
  leagueName: string;
  className?: string;
}

export default function Sidebar({
  leagueId,
  leagueName,
  className = '',
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const base = `/league/${leagueId}`;

  const links = [
    { href: base, label: 'Lobby', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: `${base}/draft`, label: 'Draft Room', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: `${base}/roster`, label: 'My Roster', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { href: `${base}/standings`, label: 'Standings', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <aside className={`w-56 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] shrink-0 ${className}`}>
      {/* League name */}
      <div className="px-4 py-5 border-b border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">League</p>
        <h2 className="text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wide text-[var(--text-primary)] truncate mt-0.5">
          {leagueName}
        </h2>
      </div>

      {/* Nav links */}
      <nav className="py-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 text-sm
                transition-all duration-150
                ${isActive
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
