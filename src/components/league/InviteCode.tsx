'use client';

import React, { useState } from 'react';

interface InviteCodeProps {
  code: string;
  className?: string;
}

export default function InviteCode({
  code,
  className = '',
}: InviteCodeProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback - do nothing
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-default)] clip-angular-sm">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Invite Code</span>
        <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-[0.2em] text-[var(--accent-teal)]">
          {code}
        </span>
      </div>
      <button
        onClick={handleCopy}
        className={`
          px-3 py-2 text-xs font-bold font-[family-name:var(--font-display)] uppercase tracking-wider
          clip-angular-sm transition-all duration-150
          ${copied
            ? 'bg-[var(--status-success)] text-[var(--text-on-accent)]'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-red)] hover:text-[var(--text-on-accent)]'
          }
        `}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
