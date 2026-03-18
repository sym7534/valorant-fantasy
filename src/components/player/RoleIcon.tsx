import React from 'react';
import type { PlayerRole } from '@/src/lib/game-config';

interface RoleIconProps {
  role: PlayerRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const roleColors: Record<PlayerRole, string> = {
  Duelist: '#ff4655',
  Initiator: '#2dd4bf',
  Controller: '#a78bfa',
  Sentinel: '#fbbf24',
};

const rolePaths: Record<PlayerRole, string> = {
  Duelist: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
  Initiator: 'M12 2L2 12L12 22L22 12L12 2ZM12 6L18 12L12 18L6 12L12 6Z',
  Controller: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z',
  Sentinel: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 3.9l5 2.22V11c0 3.87-2.53 7.51-5 8.77-2.47-1.26-5-4.9-5-8.77V7.12l5-2.22z',
};

const roleAbbreviations: Record<PlayerRole, string> = {
  Duelist: 'D',
  Initiator: 'I',
  Controller: 'C',
  Sentinel: 'S',
};

export default function RoleIcon({
  role,
  size = 'md',
  className = '',
}: RoleIconProps): React.ReactElement {
  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const s = sizeMap[size];

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill={roleColors[role]}
      className={className}
      aria-label={role}
    >
      <path d={rolePaths[role]} />
    </svg>
  );
}

/**
 * Displays role(s) for a player. Single role shows full name ("Duelist").
 * Multiple roles show abbreviated slash notation ("D/I/C").
 */
export function RoleDisplay({
  roles,
  size = 'sm',
}: {
  roles: PlayerRole[];
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  if (roles.length === 1) {
    return (
      <div className="flex items-center gap-1">
        <RoleIcon role={roles[0]} size={size} />
        <span className="text-xs text-[var(--text-muted)] uppercase">{roles[0]}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <RoleIcon role={roles[0]} size={size} />
      <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">
        {roles.map((r) => roleAbbreviations[r]).join('/')}
      </span>
    </div>
  );
}

export { roleColors, roleAbbreviations };
