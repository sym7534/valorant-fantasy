import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: AvatarProps): React.ReactElement {
  const styles = sizeStyles[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${styles.container} rounded-full object-cover border border-[var(--border-default)] ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${styles.container} rounded-full bg-[var(--bg-tertiary)]
        flex items-center justify-center border border-[var(--border-default)]
        ${className}
      `}
    >
      <span
        className={`
          ${styles.text} font-bold font-[family-name:var(--font-display)]
          text-[var(--text-secondary)]
        `}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}
