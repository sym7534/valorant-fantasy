'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TimerProps {
  deadline: Date;
  onExpire?: () => void;
  className?: string;
}

export default function Timer({
  deadline,
  onExpire,
  className = '',
}: TimerProps): React.ReactElement {
  const calculateRemaining = useCallback((): number => {
    const now = new Date().getTime();
    const target = deadline.getTime();
    return Math.max(0, Math.floor((target - now) / 1000));
  }, [deadline]);

  const [remaining, setRemaining] = useState<number>(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = calculateRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateRemaining, onExpire]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  const colorClass =
    remaining > 300
      ? 'text-[var(--status-success)]'
      : remaining > 60
        ? 'text-[var(--status-warning)]'
        : 'text-[var(--accent-red)]';

  const glowClass =
    remaining <= 60 ? 'animate-countdown-urgency' : '';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span
        className={`
          text-2xl font-bold font-[family-name:var(--font-display)] tabular-nums tracking-wider
          ${colorClass} ${glowClass}
        `}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
