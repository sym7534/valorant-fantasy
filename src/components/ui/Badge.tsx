import React from 'react';

type BadgeVariant = 'default' | 'red' | 'gold' | 'teal' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
  glow?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-default)]',
  red: 'bg-[var(--accent-red-muted)] text-[var(--accent-red)] border-[var(--border-accent)]',
  gold: 'bg-[var(--accent-gold-muted)] text-[var(--accent-gold)] border-[rgba(245,197,66,0.2)]',
  teal: 'bg-[rgba(45,212,191,0.1)] text-[var(--accent-teal)] border-[rgba(45,212,191,0.2)]',
  success: 'bg-[rgba(74,222,128,0.1)] text-[var(--status-success)] border-[rgba(74,222,128,0.2)]',
  warning: 'bg-[rgba(251,191,36,0.1)] text-[var(--status-warning)] border-[rgba(251,191,36,0.2)]',
  error: 'bg-[rgba(239,68,68,0.1)] text-[var(--status-error)] border-[rgba(239,68,68,0.2)]',
  muted: 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)]',
};

const sizeStyles: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
  size = 'sm',
  glow = false,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={`
        inline-flex items-center gap-1 border rounded-sm
        font-[family-name:var(--font-display)] font-semibold uppercase tracking-wider
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${glow && variant === 'gold' ? 'animate-pulse-glow' : ''}
        ${glow && variant === 'red' ? 'animate-pulse-red' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
