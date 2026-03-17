import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  angular?: boolean;
  glowColor?: 'red' | 'gold' | 'teal' | 'none';
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  angular = true,
  glowColor = 'none',
  hover = false,
  onClick,
}: CardProps): React.ReactElement {
  const glowStyles = {
    red: 'border-[var(--border-accent)] glow-red',
    gold: 'border-[rgba(245,197,66,0.2)] glow-gold',
    teal: 'border-[rgba(45,212,191,0.15)] glow-teal',
    none: 'border-[var(--border-default)]',
  };

  return (
    <div
      className={`
        bg-[var(--bg-secondary)] border
        ${angular ? 'clip-angular' : 'rounded-lg'}
        ${glowStyles[glowColor]}
        ${hover ? 'hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-red)] cursor-pointer transition-all duration-150' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
