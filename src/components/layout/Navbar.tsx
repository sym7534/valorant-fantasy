'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  userName?: string;
  userImage?: string;
  className?: string;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/league/create', label: 'Create League' },
  { href: '/league/join', label: 'Join League' },
];

export default function Navbar({
  userName,
  className = '',
}: NavbarProps): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className={`sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)] ${className}`}>
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Image
            src="/vctlogo.png"
            alt="VCT Fantasy"
            width={32}
            height={32}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent-red)] transition-colors">
            VCT <span className="text-[var(--accent-red)]">Fantasy</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  px-4 py-2 text-sm font-medium font-[family-name:var(--font-body)]
                  transition-all duration-150 rounded-sm
                  ${isActive
                    ? 'text-[var(--accent-red)] bg-[rgba(255,70,85,0.08)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {userName ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="text-xs font-bold font-[family-name:var(--font-display)] text-[var(--text-secondary)]">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-[var(--text-primary)] font-medium">{userName}</span>
            </div>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 text-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
                bg-[var(--accent-red)] text-[var(--text-on-accent)] clip-angular-sm
                hover:bg-[var(--accent-red-hover)] transition-all duration-150"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
