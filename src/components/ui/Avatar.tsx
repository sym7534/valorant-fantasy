import React from 'react';
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; imageSize: string }> = {
  sm: { container: 'w-8 h-8', text: 'text-xs', imageSize: '32px' },
  md: { container: 'w-10 h-10', text: 'text-sm', imageSize: '40px' },
  lg: { container: 'w-14 h-14', text: 'text-lg', imageSize: '56px' },
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
      <div
        className={`${styles.container} relative overflow-hidden rounded-full border border-[var(--border-default)] ${className}`}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes={styles.imageSize}
          className="object-cover"
        />
      </div>
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
