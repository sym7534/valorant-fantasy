'use client';

import React, { useState, useRef } from 'react';

type TooltipPosition = 'top' | 'bottom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleMouseEnter(): void {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }

  function handleMouseLeave(): void {
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  }

  const positionClasses =
    position === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 ${positionClasses}
            px-3 py-2 text-xs font-medium
            bg-[var(--bg-accent)] text-[var(--text-primary)]
            border border-[var(--border-default)]
            rounded-sm shadow-lg whitespace-nowrap
            animate-fade-in pointer-events-none
          `}
        >
          {content}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-2 h-2
              bg-[var(--bg-accent)] border-[var(--border-default)]
              rotate-45
              ${position === 'top' ? 'top-full -mt-1 border-r border-b' : 'bottom-full -mb-1 border-l border-t'}
            `}
          />
        </div>
      )}
    </div>
  );
}
