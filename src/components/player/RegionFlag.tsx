import React from 'react';
import type { Region } from '@/src/lib/game-config';

interface RegionFlagProps {
  region: Region;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const regionAbbrev: Record<Region, string> = {
  Americas: 'AM',
  Pacific: 'PAC',
  EMEA: 'EU',
  China: 'CN',
};

export const regionColors: Record<Region, string> = {
  Americas: '#ff4655',
  Pacific: '#3b82f6',
  EMEA: '#4ade80',
  China: '#a78bfa',
};

export const regionBgTint: Record<Region, string> = {
  Americas: 'rgba(255, 70, 85, 0.08)',
  Pacific: 'rgba(59, 130, 246, 0.08)',
  EMEA: 'rgba(74, 222, 128, 0.08)',
  China: 'rgba(167, 139, 250, 0.08)',
};

export default function RegionFlag({
  region,
  size = 'md',
  showLabel = false,
  className = '',
}: RegionFlagProps): React.ReactElement {
  const s = size === 'sm' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`${s} rounded-sm font-bold font-[family-name:var(--font-display)] uppercase tracking-wider leading-none`}
        style={{ backgroundColor: `${regionColors[region]}20`, color: regionColors[region] }}
        title={region}
      >
        {regionAbbrev[region]}
      </span>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{region}</span>
      )}
    </div>
  );
}
